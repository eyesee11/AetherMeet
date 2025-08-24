const Room = require('../models/Room');
const User = require('../models/User');

/**
 * Advanced Moderation System for AetherMeet
 * Provides comprehensive room management and user moderation tools
 */

class ModerationManager {
    constructor() {
        this.moderationActions = {
            WARN: 'warn',
            MUTE: 'mute',
            KICK: 'kick',
            BAN: 'ban',
            DELETE_MESSAGE: 'delete_message',
            RESTRICT_MEDIA: 'restrict_media'
        };

        this.violationTypes = {
            SPAM: 'spam',
            HARASSMENT: 'harassment',
            INAPPROPRIATE_CONTENT: 'inappropriate_content',
            UNAUTHORIZED_SHARING: 'unauthorized_sharing',
            FLOODING: 'flooding'
        };
    }

    /**
     * Apply moderation action to a user in a room
     * @param {string} roomCode - Room identifier
     * @param {string} targetUsername - User to moderate
     * @param {string} moderatorUsername - Moderator applying action
     * @param {string} action - Moderation action
     * @param {string} reason - Reason for moderation
     * @param {number} duration - Duration in minutes (for temporary actions)
     * @returns {object} Moderation result
     */
    async applyModerationAction(roomCode, targetUsername, moderatorUsername, action, reason, duration = null) {
        try {
            const room = await Room.findOne({ roomCode, isActive: true });
            if (!room) {
                throw new Error('Room not found');
            }

            // Check moderator permissions
            const canModerate = await this.checkModerationPermissions(room, moderatorUsername);
            if (!canModerate) {
                throw new Error('Insufficient permissions');
            }

            // Prevent self-moderation
            if (targetUsername === moderatorUsername) {
                throw new Error('Cannot moderate yourself');
            }

            // Prevent moderating room owner (unless admin action)
            if (targetUsername === room.owner && moderatorUsername !== 'system') {
                throw new Error('Cannot moderate room owner');
            }

            const moderationEntry = {
                targetUsername,
                moderatorUsername,
                action,
                reason,
                duration,
                timestamp: new Date(),
                isActive: true,
                expiresAt: duration ? new Date(Date.now() + duration * 60 * 1000) : null
            };

            // Initialize moderation log if not exists
            if (!room.moderationLog) {
                room.moderationLog = [];
            }

            room.moderationLog.push(moderationEntry);
            await room.save();

            // Apply the specific action
            await this.executeModerationAction(room, targetUsername, action, duration);

            return {
                success: true,
                action,
                targetUsername,
                moderatorUsername,
                reason,
                duration,
                timestamp: moderationEntry.timestamp
            };

        } catch (error) {
            console.error('Moderation action error:', error);
            throw error;
        }
    }

    /**
     * Check if user has moderation permissions
     * @param {object} room - Room object
     * @param {string} username - Username to check
     * @returns {boolean} Has moderation permissions
     */
    async checkModerationPermissions(room, username) {
        // Room owner always has moderation permissions
        if (room.owner === username) {
            return true;
        }

        // Check if user is a designated moderator
        if (room.moderators && room.moderators.includes(username)) {
            return true;
        }

        // Check if user has admin privileges (system-level)
        const user = await User.findOne({ username });
        if (user && user.isAdmin) {
            return true;
        }

        return false;
    }

    /**
     * Execute specific moderation action
     * @param {object} room - Room object
     * @param {string} username - Target username
     * @param {string} action - Action to execute
     * @param {number} duration - Duration in minutes
     */
    async executeModerationAction(room, username, action, duration) {
        switch (action) {
            case this.moderationActions.WARN:
                // Warning is just logged, no immediate action
                break;

            case this.moderationActions.MUTE:
                await this.muteUser(room, username, duration);
                break;

            case this.moderationActions.KICK:
                await this.kickUser(room, username);
                break;

            case this.moderationActions.BAN:
                await this.banUser(room, username, duration);
                break;

            case this.moderationActions.RESTRICT_MEDIA:
                await this.restrictUserMedia(room, username, duration);
                break;

            default:
                console.warn(`Unknown moderation action: ${action}`);
        }
    }

    /**
     * Mute a user (prevent them from sending messages)
     * @param {object} room - Room object
     * @param {string} username - Username to mute
     * @param {number} duration - Duration in minutes
     */
    async muteUser(room, username, duration) {
        if (!room.mutedUsers) {
            room.mutedUsers = [];
        }

        const existingMute = room.mutedUsers.find(mute => mute.username === username);
        if (existingMute) {
            // Update existing mute
            existingMute.expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null;
            existingMute.isPermanent = !duration;
        } else {
            // Add new mute
            room.mutedUsers.push({
                username,
                mutedAt: new Date(),
                expiresAt: duration ? new Date(Date.now() + duration * 60 * 1000) : null,
                isPermanent: !duration
            });
        }

        await room.save();
    }

    /**
     * Kick a user from the room
     * @param {object} room - Room object
     * @param {string} username - Username to kick
     */
    async kickUser(room, username) {
        // Remove from members list
        room.members = room.members.filter(member => member.username !== username);
        
        // Remove from pending members if exists
        room.pendingMembers = room.pendingMembers.filter(member => member.username !== username);
        
        await room.save();
    }

    /**
     * Ban a user from the room
     * @param {object} room - Room object
     * @param {string} username - Username to ban
     * @param {number} duration - Duration in minutes (null for permanent)
     */
    async banUser(room, username, duration) {
        // First kick the user
        await this.kickUser(room, username);

        // Add to banned users list
        if (!room.bannedUsers) {
            room.bannedUsers = [];
        }

        const existingBan = room.bannedUsers.find(ban => ban.username === username);
        if (existingBan) {
            // Update existing ban
            existingBan.expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null;
            existingBan.isPermanent = !duration;
        } else {
            // Add new ban
            room.bannedUsers.push({
                username,
                bannedAt: new Date(),
                expiresAt: duration ? new Date(Date.now() + duration * 60 * 1000) : null,
                isPermanent: !duration
            });
        }

        await room.save();
    }

    /**
     * Restrict user's media sharing capabilities
     * @param {object} room - Room object
     * @param {string} username - Username to restrict
     * @param {number} duration - Duration in minutes
     */
    async restrictUserMedia(room, username, duration) {
        if (!room.mediaRestrictedUsers) {
            room.mediaRestrictedUsers = [];
        }

        const existingRestriction = room.mediaRestrictedUsers.find(restriction => restriction.username === username);
        if (existingRestriction) {
            // Update existing restriction
            existingRestriction.expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null;
            existingRestriction.isPermanent = !duration;
        } else {
            // Add new restriction
            room.mediaRestrictedUsers.push({
                username,
                restrictedAt: new Date(),
                expiresAt: duration ? new Date(Date.now() + duration * 60 * 1000) : null,
                isPermanent: !duration
            });
        }

        await room.save();
    }

    /**
     * Check if user is currently muted
     * @param {object} room - Room object
     * @param {string} username - Username to check
     * @returns {boolean} Is user muted
     */
    isUserMuted(room, username) {
        if (!room.mutedUsers) return false;

        const mute = room.mutedUsers.find(mute => mute.username === username);
        if (!mute) return false;

        // Check if mute has expired
        if (!mute.isPermanent && mute.expiresAt && new Date() > mute.expiresAt) {
            return false;
        }

        return true;
    }

    /**
     * Check if user is currently banned
     * @param {object} room - Room object
     * @param {string} username - Username to check
     * @returns {boolean} Is user banned
     */
    isUserBanned(room, username) {
        if (!room.bannedUsers) return false;

        const ban = room.bannedUsers.find(ban => ban.username === username);
        if (!ban) return false;

        // Check if ban has expired
        if (!ban.isPermanent && ban.expiresAt && new Date() > ban.expiresAt) {
            return false;
        }

        return true;
    }

    /**
     * Check if user's media is restricted
     * @param {object} room - Room object
     * @param {string} username - Username to check
     * @returns {boolean} Is user media restricted
     */
    isUserMediaRestricted(room, username) {
        if (!room.mediaRestrictedUsers) return false;

        const restriction = room.mediaRestrictedUsers.find(restriction => restriction.username === username);
        if (!restriction) return false;

        // Check if restriction has expired
        if (!restriction.isPermanent && restriction.expiresAt && new Date() > restriction.expiresAt) {
            return false;
        }

        return true;
    }

    /**
     * Get moderation history for a room
     * @param {string} roomCode - Room code
     * @param {number} limit - Number of entries to return
     * @returns {array} Moderation log entries
     */
    async getModerationHistory(roomCode, limit = 50) {
        try {
            const room = await Room.findOne({ roomCode });
            if (!room || !room.moderationLog) {
                return [];
            }

            return room.moderationLog
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching moderation history:', error);
            return [];
        }
    }

    /**
     * Clean up expired moderation actions
     * @param {string} roomCode - Room code
     */
    async cleanupExpiredActions(roomCode) {
        try {
            const room = await Room.findOne({ roomCode });
            if (!room) return;

            const now = new Date();

            // Clean up expired mutes
            if (room.mutedUsers) {
                room.mutedUsers = room.mutedUsers.filter(mute => 
                    mute.isPermanent || !mute.expiresAt || mute.expiresAt > now
                );
            }

            // Clean up expired bans
            if (room.bannedUsers) {
                room.bannedUsers = room.bannedUsers.filter(ban => 
                    ban.isPermanent || !ban.expiresAt || ban.expiresAt > now
                );
            }

            // Clean up expired media restrictions
            if (room.mediaRestrictedUsers) {
                room.mediaRestrictedUsers = room.mediaRestrictedUsers.filter(restriction => 
                    restriction.isPermanent || !restriction.expiresAt || restriction.expiresAt > now
                );
            }

            await room.save();
        } catch (error) {
            console.error('Error cleaning up expired actions:', error);
        }
    }

    /**
     * Add user as room moderator
     * @param {string} roomCode - Room code
     * @param {string} username - Username to promote
     * @param {string} promoterUsername - Username of person promoting
     */
    async addModerator(roomCode, username, promoterUsername) {
        try {
            const room = await Room.findOne({ roomCode });
            if (!room) {
                throw new Error('Room not found');
            }

            // Only room owner can add moderators
            if (room.owner !== promoterUsername) {
                throw new Error('Only room owner can add moderators');
            }

            if (!room.moderators) {
                room.moderators = [];
            }

            if (!room.moderators.includes(username)) {
                room.moderators.push(username);
                await room.save();
            }

            return { success: true, message: `${username} is now a moderator` };
        } catch (error) {
            console.error('Error adding moderator:', error);
            throw error;
        }
    }

    /**
     * Remove user as room moderator
     * @param {string} roomCode - Room code
     * @param {string} username - Username to demote
     * @param {string} demotorUsername - Username of person demoting
     */
    async removeModerator(roomCode, username, demotorUsername) {
        try {
            const room = await Room.findOne({ roomCode });
            if (!room) {
                throw new Error('Room not found');
            }

            // Only room owner can remove moderators
            if (room.owner !== demotorUsername) {
                throw new Error('Only room owner can remove moderators');
            }

            if (room.moderators) {
                room.moderators = room.moderators.filter(mod => mod !== username);
                await room.save();
            }

            return { success: true, message: `${username} is no longer a moderator` };
        } catch (error) {
            console.error('Error removing moderator:', error);
            throw error;
        }
    }
}

module.exports = new ModerationManager();
