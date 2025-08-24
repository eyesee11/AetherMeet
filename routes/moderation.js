const express = require('express');
const { authenticateToken } = require('../utils/helpers');
const { adminLimiter, validateModerationAction, logSecurityEvent } = require('../middleware/security');
const moderationManager = require('../utils/moderation');
const Room = require('../models/Room');
const User = require('../models/User');

const router = express.Router();

/**
 * Advanced Moderation API Routes
 * Provides comprehensive moderation tools for room management
 */

// Apply moderation action
router.post('/rooms/:roomCode/moderate', authenticateToken, async (req, res) => {
    try {
        const { roomCode } = req.params;
        const { targetUsername, action, reason, duration } = req.body;
        const moderatorUsername = req.user.username;

        // Validate input
        validateModerationAction(action, reason, duration);

        // Apply moderation action
        const result = await moderationManager.applyModerationAction(
            roomCode,
            targetUsername,
            moderatorUsername,
            action,
            reason,
            duration
        );

        // Log security event
        logSecurityEvent('moderation_action', {
            action,
            targetUsername,
            roomCode,
            reason
        }, req);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Moderation action error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Get moderation history for a room
router.get('/rooms/:roomCode/moderation-history', authenticateToken, async (req, res) => {
    try {
        const { roomCode } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        
        const room = await Room.findOne({ roomCode });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if user has permission to view moderation history
        const canView = await moderationManager.checkModerationPermissions(room, req.user.username);
        if (!canView) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        const history = await moderationManager.getModerationHistory(roomCode, limit);

        res.json({
            success: true,
            data: {
                roomCode,
                history,
                total: history.length
            }
        });

    } catch (error) {
        console.error('Moderation history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve moderation history'
        });
    }
});

// Add room moderator
router.post('/rooms/:roomCode/moderators', authenticateToken, async (req, res) => {
    try {
        const { roomCode } = req.params;
        const { username } = req.body;
        const promoterUsername = req.user.username;

        const result = await moderationManager.addModerator(roomCode, username, promoterUsername);

        logSecurityEvent('moderator_added', {
            roomCode,
            newModerator: username,
            promoter: promoterUsername
        }, req);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Add moderator error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Remove room moderator
router.delete('/rooms/:roomCode/moderators/:username', authenticateToken, async (req, res) => {
    try {
        const { roomCode, username } = req.params;
        const demotorUsername = req.user.username;

        const result = await moderationManager.removeModerator(roomCode, username, demotorUsername);

        logSecurityEvent('moderator_removed', {
            roomCode,
            removedModerator: username,
            demoter: demotorUsername
        }, req);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Remove moderator error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Check user moderation permissions
router.get('/rooms/:roomCode/permissions', authenticateToken, async (req, res) => {
    try {
        const { roomCode } = req.params;
        const username = req.user.username;

        const room = await Room.findOne({ roomCode });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const canModerate = await moderationManager.checkModerationPermissions(room, username);
        const isOwner = room.owner === username;
        const isModerator = room.moderators && room.moderators.includes(username);

        res.json({
            success: true,
            data: {
                username,
                roomCode,
                canModerate,
                isOwner,
                isModerator,
                permissions: {
                    canWarn: canModerate,
                    canMute: canModerate,
                    canKick: canModerate,
                    canBan: isOwner,
                    canAddModerators: isOwner,
                    canRemoveModerators: isOwner,
                    canViewHistory: canModerate
                }
            }
        });

    } catch (error) {
        console.error('Check permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check permissions'
        });
    }
});

// Get active moderation statuses for a room
router.get('/rooms/:roomCode/moderation-status', authenticateToken, async (req, res) => {
    try {
        const { roomCode } = req.params;

        const room = await Room.findOne({ roomCode });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check permissions
        const canView = await moderationManager.checkModerationPermissions(room, req.user.username);
        if (!canView) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        // Clean up expired actions first
        await moderationManager.cleanupExpiredActions(roomCode);

        // Get current active statuses
        const room_updated = await Room.findOne({ roomCode });
        
        res.json({
            success: true,
            data: {
                roomCode,
                mutedUsers: room_updated.mutedUsers || [],
                bannedUsers: room_updated.bannedUsers || [],
                mediaRestrictedUsers: room_updated.mediaRestrictedUsers || [],
                moderators: room_updated.moderators || []
            }
        });

    } catch (error) {
        console.error('Moderation status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve moderation status'
        });
    }
});

// Bulk moderation action (admin only)
router.post('/admin/bulk-moderate', authenticateToken, adminLimiter, async (req, res) => {
    try {
        // Check if user is admin
        const user = await User.findOne({ username: req.user.username });
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const { usernames, action, reason, duration } = req.body;

        if (!Array.isArray(usernames) || usernames.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Usernames array is required'
            });
        }

        validateModerationAction(action, reason, duration);

        const results = [];
        const moderatorUsername = 'system'; // System-level moderation

        for (const username of usernames) {
            try {
                // Find all active rooms where this user is a member
                const rooms = await Room.find({
                    'members.username': username,
                    isActive: true
                });

                for (const room of rooms) {
                    const result = await moderationManager.applyModerationAction(
                        room.roomCode,
                        username,
                        moderatorUsername,
                        action,
                        reason,
                        duration
                    );
                    results.push({
                        username,
                        roomCode: room.roomCode,
                        success: true,
                        result
                    });
                }
            } catch (error) {
                results.push({
                    username,
                    success: false,
                    error: error.message
                });
            }
        }

        logSecurityEvent('bulk_moderation', {
            action,
            usernames,
            reason,
            results: results.length
        }, req);

        res.json({
            success: true,
            data: {
                action,
                processedUsers: usernames.length,
                results
            }
        });

    } catch (error) {
        console.error('Bulk moderation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform bulk moderation'
        });
    }
});

// Get global moderation statistics (admin only)
router.get('/admin/moderation-stats', authenticateToken, adminLimiter, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const timeRange = req.query.timeRange || '24h';
        let startTime;
        const now = new Date();

        switch (timeRange) {
            case '1h':
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '7d':
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default: // 24h
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }

        // Aggregate moderation statistics across all rooms
        const stats = await Room.aggregate([
            {
                $match: {
                    'moderationLog.timestamp': { $gte: startTime }
                }
            },
            {
                $unwind: '$moderationLog'
            },
            {
                $match: {
                    'moderationLog.timestamp': { $gte: startTime }
                }
            },
            {
                $group: {
                    _id: '$moderationLog.action',
                    count: { $sum: 1 },
                    uniqueRooms: { $addToSet: '$roomCode' },
                    uniqueModerators: { $addToSet: '$moderationLog.moderatorUsername' },
                    uniqueTargets: { $addToSet: '$moderationLog.targetUsername' }
                }
            },
            {
                $project: {
                    action: '$_id',
                    count: 1,
                    uniqueRoomCount: { $size: '$uniqueRooms' },
                    uniqueModeratorCount: { $size: '$uniqueModerators' },
                    uniqueTargetCount: { $size: '$uniqueTargets' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                timeRange,
                period: { start: startTime, end: now },
                stats
            }
        });

    } catch (error) {
        console.error('Moderation stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve moderation statistics'
        });
    }
});

module.exports = router;
