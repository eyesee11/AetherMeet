const express = require('express');
const { authenticateToken } = require('../utils/helpers');
const memoryManager = require('../utils/memoryManager');
const { adminLimiter } = require('../middleware/security');

const router = express.Router();

// Get memory statistics (admin only)
router.get('/stats', adminLimiter, authenticateToken, async (req, res) => {
    try {
        // Check if user is admin (you can implement your admin check logic)
        const isAdmin = req.user.username === 'admin' || req.user.isAdmin;
        
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const memoryStats = memoryManager.getStats();
        const roomStats = await memoryManager.getRoomStats();

        res.json({
            success: true,
            data: {
                memory: memoryStats,
                rooms: roomStats,
                server: {
                    uptime: process.uptime(),
                    nodeVersion: process.version,
                    platform: process.platform
                }
            }
        });
    } catch (error) {
        console.error('Memory stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get memory statistics'
        });
    }
});

// Force cleanup (admin only)
router.post('/cleanup', adminLimiter, authenticateToken, async (req, res) => {
    try {
        const isAdmin = req.user.username === 'admin' || req.user.isAdmin;
        
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const stats = await memoryManager.forceCleanup();
        
        res.json({
            success: true,
            message: 'Memory cleanup completed',
            data: stats
        });
    } catch (error) {
        console.error('Force cleanup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform cleanup'
        });
    }
});

// Get room statistics for monitoring
router.get('/rooms', adminLimiter, authenticateToken, async (req, res) => {
    try {
        const isAdmin = req.user.username === 'admin' || req.user.isAdmin;
        
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const roomStats = await memoryManager.getRoomStats();
        
        res.json({
            success: true,
            data: roomStats
        });
    } catch (error) {
        console.error('Room stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get room statistics'
        });
    }
});

module.exports = router;
