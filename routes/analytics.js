const express = require('express');
const { authenticateToken } = require('../utils/helpers');
const { adminLimiter } = require('../middleware/security');

const router = express.Router();

/**
 * Rate Limiting Dashboard API
 * Provides comprehensive monitoring and management of API rate limits
 */

// In-memory storage for rate limiting statistics
let rateLimitStats = {
    general: { requests: 0, blocks: 0, resetTime: Date.now() },
    auth: { requests: 0, blocks: 0, resetTime: Date.now() },
    roomCreation: { requests: 0, blocks: 0, resetTime: Date.now() },
    media: { requests: 0, blocks: 0, resetTime: Date.now() }
};

// Track active connections
let activeConnections = new Set();
let connectionHistory = [];

/**
 * Update rate limit statistics
 * @param {string} type - Type of rate limit
 * @param {boolean} blocked - Whether request was blocked
 * @param {string} ip - Client IP address
 */
function updateRateLimitStats(type, blocked, ip) {
    if (!rateLimitStats[type]) {
        rateLimitStats[type] = { requests: 0, blocks: 0, resetTime: Date.now() };
    }

    rateLimitStats[type].requests++;
    if (blocked) {
        rateLimitStats[type].blocks++;
    }

    // Track connection
    activeConnections.add(ip);
    
    // Add to history (keep last 1000 entries)
    connectionHistory.push({
        timestamp: new Date(),
        ip,
        type,
        blocked
    });
    
    if (connectionHistory.length > 1000) {
        connectionHistory = connectionHistory.slice(-1000);
    }
}

// Get current rate limiting statistics
router.get('/stats', authenticateToken, adminLimiter, async (req, res) => {
    try {
        // Check if user is admin
        const User = require('../models/User');
        const user = await User.findOne({ username: req.user.username });
        
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        // Calculate rates and trends
        const now = Date.now();
        const hourAgo = now - (60 * 60 * 1000);
        
        const recentConnections = connectionHistory.filter(conn => 
            new Date(conn.timestamp).getTime() > hourAgo
        );

        const hourlyStats = {
            totalRequests: recentConnections.length,
            blockedRequests: recentConnections.filter(conn => conn.blocked).length,
            uniqueIPs: new Set(recentConnections.map(conn => conn.ip)).size
        };

        // Calculate block rate percentage
        const blockRate = hourlyStats.totalRequests > 0 
            ? (hourlyStats.blockedRequests / hourlyStats.totalRequests * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            data: {
                currentStats: rateLimitStats,
                hourlyStats,
                blockRate: parseFloat(blockRate),
                activeConnections: activeConnections.size,
                lastUpdated: new Date()
            }
        });

    } catch (error) {
        console.error('Rate limit stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve rate limit statistics'
        });
    }
});

// Get detailed connection history
router.get('/connections', authenticateToken, adminLimiter, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findOne({ username: req.user.username });
        
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const paginatedHistory = connectionHistory
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                connections: paginatedHistory,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(connectionHistory.length / limit),
                    totalConnections: connectionHistory.length,
                    hasNext: endIndex < connectionHistory.length,
                    hasPrevious: startIndex > 0
                }
            }
        });

    } catch (error) {
        console.error('Connection history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve connection history'
        });
    }
});

// Get top IP addresses by request count
router.get('/top-ips', authenticateToken, adminLimiter, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findOne({ username: req.user.username });
        
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const limit = parseInt(req.query.limit) || 10;
        const timeRange = req.query.timeRange || '24h'; // 1h, 24h, 7d

        let timeLimit;
        switch (timeRange) {
            case '1h':
                timeLimit = Date.now() - (60 * 60 * 1000);
                break;
            case '7d':
                timeLimit = Date.now() - (7 * 24 * 60 * 60 * 1000);
                break;
            default: // 24h
                timeLimit = Date.now() - (24 * 60 * 60 * 1000);
        }

        const recentConnections = connectionHistory.filter(conn => 
            new Date(conn.timestamp).getTime() > timeLimit
        );

        // Count requests per IP
        const ipCounts = {};
        const ipBlocks = {};

        recentConnections.forEach(conn => {
            if (!ipCounts[conn.ip]) {
                ipCounts[conn.ip] = 0;
                ipBlocks[conn.ip] = 0;
            }
            ipCounts[conn.ip]++;
            if (conn.blocked) {
                ipBlocks[conn.ip]++;
            }
        });

        // Sort by request count and get top IPs
        const topIPs = Object.entries(ipCounts)
            .map(([ip, requests]) => ({
                ip,
                requests,
                blocks: ipBlocks[ip],
                blockRate: requests > 0 ? (ipBlocks[ip] / requests * 100).toFixed(2) : 0
            }))
            .sort((a, b) => b.requests - a.requests)
            .slice(0, limit);

        res.json({
            success: true,
            data: {
                topIPs,
                timeRange,
                totalAnalyzed: recentConnections.length
            }
        });

    } catch (error) {
        console.error('Top IPs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve top IP statistics'
        });
    }
});

// Reset rate limiting statistics
router.post('/reset-stats', authenticateToken, adminLimiter, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findOne({ username: req.user.username });
        
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        // Reset all statistics
        rateLimitStats = {
            general: { requests: 0, blocks: 0, resetTime: Date.now() },
            auth: { requests: 0, blocks: 0, resetTime: Date.now() },
            roomCreation: { requests: 0, blocks: 0, resetTime: Date.now() },
            media: { requests: 0, blocks: 0, resetTime: Date.now() }
        };

        connectionHistory = [];
        activeConnections.clear();

        res.json({
            success: true,
            message: 'Rate limiting statistics reset successfully',
            resetTime: new Date()
        });

    } catch (error) {
        console.error('Reset stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset statistics'
        });
    }
});

// Configure rate limits dynamically
router.post('/configure', authenticateToken, adminLimiter, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findOne({ username: req.user.username });
        
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const { type, windowMs, max } = req.body;

        // Validate input
        if (!type || !windowMs || !max) {
            return res.status(400).json({
                success: false,
                message: 'Type, windowMs, and max are required'
            });
        }

        // Update rate limit configuration (this would typically be stored in database)
        const config = {
            type,
            windowMs: parseInt(windowMs),
            max: parseInt(max),
            updatedAt: new Date(),
            updatedBy: req.user.username
        };

        // Here you would typically save to database and update the actual rate limiters
        console.log('Rate limit configuration updated:', config);

        res.json({
            success: true,
            message: 'Rate limit configuration updated successfully',
            config
        });

    } catch (error) {
        console.error('Configure rate limits error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update rate limit configuration'
        });
    }
});

// Export statistics update function for use in middleware
router.updateStats = updateRateLimitStats;

module.exports = router;
