const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Import routes and models
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const notesRoutes = require('./routes/notes');
const mediaRoutes = require('./routes/media');
const socketHandler = require('./socket/socketHandler');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
app.use(express.static('public'));
app.use('/storage', express.static('storage'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aethermeet', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes(io)); // Pass io instance to room routes
app.use('/api/notes', notesRoutes);
app.use('/api/media', mediaRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
    const pendingRoomCode = req.session.pendingRoomCode;
    res.render('index', { pendingRoomCode: pendingRoomCode || null });
});

app.get('/dashboard', (req, res) => {
    const roomCode = req.query.roomCode || req.session.pendingRoomCode;
    // Clear the pending room code from session once used
    if (req.session.pendingRoomCode) {
        delete req.session.pendingRoomCode;
    }
    res.render('dashboard', { roomCode: roomCode || null });
});

app.get('/notes', (req, res) => {
    res.render('notes');
});

app.get('/room/:roomCode', async (req, res) => {
    try {
        const { roomCode } = req.params;
        let isDemo = req.query.demo === 'true';
        
        const Room = require('./models/Room');
        
        // Check if room exists
        const room = await Room.findOne({ 
            roomCode: roomCode.toUpperCase(),
            isActive: true 
        });
        
        if (!room) {
            return res.status(404).send('Room not found or expired');
        }
        
        // Auto-detect if this is a demo room (even if demo param is missing)
        if (room.isDemoRoom) {
            isDemo = true;
            // Redirect to include demo parameter if missing
            if (req.query.demo !== 'true') {
                return res.redirect(`/room/${roomCode}?demo=true`);
            }
        }
        
        res.render('room', { 
            roomCode: req.params.roomCode,
            isDemo: isDemo
        });
    } catch (error) {
        console.error('Room access error:', error);
        res.status(500).send('Server error');
    }
});

// Handle share links - redirect to dashboard with room code
app.get('/join/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    
    // Check if user is authenticated
    const token = req.cookies.token;
    
    if (!token) {
        // Store room code in session and redirect to login
        req.session.pendingRoomCode = roomCode.toUpperCase();
        return res.redirect('/');
    }
    
    try {
        // Verify token
        jwt.verify(token, process.env.JWT_SECRET);
        // User is authenticated, redirect to dashboard with room code
        res.redirect(`/dashboard?roomCode=${roomCode.toUpperCase()}`);
    } catch (error) {
        // Invalid token, store room code and redirect to login
        req.session.pendingRoomCode = roomCode.toUpperCase();
        res.redirect('/');
    }
});

// Socket.IO handling
socketHandler(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`AetherMeet server running on port ${PORT}`);
});

module.exports = app;
