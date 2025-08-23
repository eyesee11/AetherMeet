const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../utils/helpers');
const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide username, email, and password' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User with this email or username already exists' 
            });
        }

        // Create new user
        const user = new User({ username, email, password });
        await user.save();

        // Generate JWT token with shorter expiry
        const token = jwt.sign(
            { userId: user._id, username: user.username }, 
            process.env.JWT_SECRET,
            { expiresIn: '2h' } // Reduced from 24h to 2h for better security
        );

        // Calculate expiration date
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

        // Get device info from User-Agent
        const deviceInfo = req.get('User-Agent') || 'Unknown Device';

        // Add session to user's active sessions
        await user.addSession(token, expiresAt, deviceInfo);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            expiresAt,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide username and password' 
            });
        }

        // Find user by username or email
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Generate JWT token with shorter expiry for better security
        const token = jwt.sign(
            { userId: user._id, username: user.username }, 
            process.env.JWT_SECRET,
            { expiresIn: '2h' } // Reduced from 24h to 2h for better security
        );

        // Calculate expiration date
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

        // Get device info from User-Agent
        const deviceInfo = req.get('User-Agent') || 'Unknown Device';

        // Add session to user's active sessions
        await user.addSession(token, expiresAt, deviceInfo);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            expiresAt,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Logout user (invalidate current session)
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove current session
        await user.removeSession(req.token);

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Logout from all devices
router.post('/logout-all', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove all sessions
        await user.removeAllSessions();

        res.json({
            success: true,
            message: 'Logged out from all devices successfully'
        });

    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get active sessions
router.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Clean expired sessions first
        await user.cleanExpiredSessions();

        // Return session info (without tokens for security)
        const sessions = user.activeSessions.map(session => ({
            deviceInfo: session.deviceInfo,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            isCurrent: session.token === req.token
        }));

        res.json({
            success: true,
            sessions
        });

    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Refresh token (extend session)
router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new token
        const newToken = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const deviceInfo = req.get('User-Agent') || 'Unknown Device';

        // Remove old session and add new one
        await user.removeSession(req.token);
        await user.addSession(newToken, expiresAt, deviceInfo);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            token: newToken,
            expiresAt
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
