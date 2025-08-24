const express = require('express');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Room = require('../models/Room');
const { validatePassword, authenticateToken } = require('../utils/helpers');
const { roomCreationLimiter, sanitizeInput, validateRoomCode } = require('../middleware/security');

module.exports = (io) => {
const router = express.Router();

// Create instant demo room (no authentication required) - with rate limiting
router.post('/create-demo', roomCreationLimiter, async (req, res) => {
    try {
        // Generate a simple room code
        const generateRoomCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        let roomCode;
        let existingRoom;
        
        // Ensure unique room code
        do {
            roomCode = generateRoomCode();
            existingRoom = await Room.findOne({ roomCode });
        } while (existingRoom);

        // Create demo room with simple password
        const demoRoom = new Room({
            name: `Demo Room ${roomCode}`,
            roomCode: roomCode,
            primaryPassword: 'demo123', // Simple demo password
            admissionType: 'instant_entry',
            owner: `demo-user-${Date.now()}`, // Unique demo owner identifier
            members: [],
            messages: [],
            isActive: true,
            isDemoRoom: true,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        await demoRoom.save();
        console.log('Demo room created successfully:', roomCode);

        res.json({
            success: true,
            roomCode: roomCode,
            shareableUrl: `${req.protocol}://${req.get('host')}/room/${roomCode}?demo=true`,
            message: 'Demo room created successfully'
        });

    } catch (error) {
        console.error('Demo room creation error:', error);
        console.error('Error details:', error.message);
        if (error.name === 'ValidationError') {
            console.error('Validation errors:', error.errors);
        }
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create demo room: ' + error.message
        });
    }
});

// Get room info (check if room exists and is active)
router.get('/:roomCode/info', authenticateToken, async (req, res) => {
    try {
        const { roomCode } = req.params;
        
        const room = await Room.findOne({ 
            roomCode: roomCode.toUpperCase(),
            isActive: true 
        });
        
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found or not active'
            });
        }
        
        // Return basic room info without sensitive data
        res.json({
            success: true,
            room: {
                code: room.roomCode,
                name: room.name,
                description: room.description,
                admissionType: room.admissionType,
                createdBy: room.owner,
                participantCount: room.members.length
            }
        });
    } catch (error) {
        console.error('Room info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get room info'
        });
    }
});

// Create instant room
router.post('/instant', authenticateToken, async (req, res) => {
    try {
        const { name, description, primaryPassword, secondaryPassword, admissionType } = req.body;
        const username = req.user.username;

        // Validate required fields
        if (!name || !primaryPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Room name and primary password are required' 
            });
        }

        // Validate passwords (allow any alphanumeric)
        const isPrimaryValid = await validatePassword(primaryPassword);
        if (!isPrimaryValid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Primary password must contain valid characters' 
            });
        }

        if (secondaryPassword) {
            const isSecondaryValid = await validatePassword(secondaryPassword);
            if (!isSecondaryValid) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Secondary password must contain valid characters' 
                });
            }
        }

        // Generate unique room code
        let roomCode;
        let isUnique = false;
        while (!isUnique) {
            roomCode = Room.generateRoomCode();
            const existingRoom = await Room.findOne({ roomCode, isActive: true });
            if (!existingRoom) {
                isUnique = true;
            }
        }

        // Create room
        const room = new Room({
            roomCode,
            name,
            description,
            owner: username,
            primaryPassword,
            secondaryPassword,
            admissionType: admissionType || 'owner_approval'
        });

        // Add owner as first member
        room.addMember(username);
        await room.save();

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            room: {
                roomCode: room.roomCode,
                name: room.name,
                description: room.description,
                owner: room.owner,
                admissionType: room.admissionType
            }
        });

    } catch (error) {
        console.error('Room creation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Schedule room
router.post('/schedule', authenticateToken, async (req, res) => {
    try {
        const { name, description, primaryPassword, secondaryPassword, admissionType, scheduledTime } = req.body;
        const username = req.user.username;

        // Validate required fields
        if (!name || !primaryPassword || !scheduledTime) {
            return res.status(400).json({ 
                success: false, 
                message: 'Room name, primary password, and scheduled time are required' 
            });
        }

        const scheduleDate = new Date(scheduledTime);
        if (scheduleDate <= new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Scheduled time must be in the future' 
            });
        }

        // Validate passwords (allow any alphanumeric)
        const isPrimaryValid = await validatePassword(primaryPassword);
        if (!isPrimaryValid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Primary password must contain valid characters' 
            });
        }

        if (secondaryPassword) {
            const isSecondaryValid = await validatePassword(secondaryPassword);
            if (!isSecondaryValid) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Secondary password must contain valid characters' 
                });
            }
        }

        // Generate unique room code
        let roomCode;
        let isUnique = false;
        while (!isUnique) {
            roomCode = Room.generateRoomCode();
            const existingRoom = await Room.findOne({ roomCode });
            if (!existingRoom) {
                isUnique = true;
            }
        }

        // Create scheduled room
        const room = new Room({
            roomCode,
            name,
            description,
            owner: username,
            primaryPassword,
            secondaryPassword,
            admissionType: admissionType || 'owner_approval',
            isScheduled: true,
            scheduledTime: scheduleDate,
            isActive: false
        });

        await room.save();

        // Schedule room activation
        schedule.scheduleJob(scheduleDate, async () => {
            try {
                const scheduledRoom = await Room.findById(room._id);
                if (scheduledRoom) {
                    scheduledRoom.isActive = true;
                    scheduledRoom.addMember(username);
                    await scheduledRoom.save();
                    console.log(`Room ${roomCode} activated at scheduled time`);
                }
            } catch (error) {
                console.error('Error activating scheduled room:', error);
            }
        });

        res.status(201).json({
            success: true,
            message: 'Room scheduled successfully',
            room: {
                roomCode: room.roomCode,
                name: room.name,
                description: room.description,
                owner: room.owner,
                scheduledTime: room.scheduledTime,
                admissionType: room.admissionType
            }
        });

    } catch (error) {
        console.error('Room scheduling error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Join room
router.post('/:roomCode/join', authenticateToken, async (req, res) => {
    try {
        const { roomCode } = req.params;
        const { primaryPassword, secondaryPassword } = req.body;
        const username = req.user.username;

        // Find room
        const room = await Room.findOne({ roomCode, isActive: true });
        if (!room) {
            return res.status(404).json({ 
                success: false, 
                message: 'Room not found or not active' 
            });
        }

        // Check if user is already a member
        if (room.members.find(member => member.username === username)) {
            return res.status(400).json({ 
                success: false, 
                message: 'You are already a member of this room' 
            });
        }

        // Validate passwords
        if (primaryPassword !== room.primaryPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid primary password' 
            });
        }

        if (room.secondaryPassword && secondaryPassword !== room.secondaryPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid secondary password' 
            });
        }

        // Check if user is already pending admission
        const pendingMember = room.pendingMembers.find(member => member.username === username);
        if (pendingMember) {
            return res.status(400).json({ 
                success: false, 
                message: 'Your admission request is pending approval' 
            });
        }

        // If owner approval is required, add to pending members
        if (room.admissionType === 'owner_approval' && username !== room.owner) {
            room.pendingMembers.push({ username });
            await room.save();

            // Emit real-time notification to room members
            io.to(roomCode).emit('admissionRequired', {
                username: username,
                requestedAt: new Date(),
                admissionType: room.admissionType
            });

            return res.json({
                success: true,
                message: 'Admission request sent. Waiting for owner approval.',
                status: 'pending'
            });
        }

        // If democratic voting is required, add to pending members
        if (room.admissionType === 'democratic_voting' && username !== room.owner) {
            room.pendingMembers.push({ username });
            await room.save();

            // Emit real-time notification to room members
            io.to(roomCode).emit('admissionRequired', {
                username: username,
                requestedAt: new Date(),
                admissionType: room.admissionType
            });

            return res.json({
                success: true,
                message: 'Admission request sent. Waiting for member votes.',
                status: 'pending'
            });
        }

        // Direct admission (owner or no approval required)
        room.addMember(username);
        await room.save();

        res.json({
            success: true,
            message: 'Successfully joined the room',
            status: 'joined',
            room: {
                roomCode: room.roomCode,
                name: room.name,
                description: room.description,
                owner: room.owner,
                memberCount: room.members.length
            }
        });

    } catch (error) {
        console.error('Room join error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Export chat history as PDF
router.get('/:roomCode/export', authenticateToken, async (req, res) => {
    try {
        const { roomCode } = req.params;
        const { format } = req.query; // 'download' or 'base64'
        const username = req.user.username;

        // Find room and check membership
        const room = await Room.findOne({ roomCode });
        if (!room) {
            return res.status(404).json({ 
                success: false, 
                message: 'Room not found' 
            });
        }

        const isMember = room.members.find(member => member.username === username);
        if (!isMember) {
            return res.status(403).json({ 
                success: false, 
                message: 'You must be a member to export chat history' 
            });
        }

        // Create PDF
        const doc = new PDFDocument();
        const filename = `${roomCode}_chat_export_${Date.now()}.pdf`;

        // Ensure temp directory exists
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const filepath = path.join(tempDir, filename);

        // PDF content generation (before piping to output)
        doc.fontSize(20).text('AetherMeet Chat Export', 100, 100);
        doc.fontSize(14).text(`Room: ${room.name} (${room.roomCode})`, 100, 140);
        doc.text(`Export Date: ${new Date().toLocaleString()}`, 100, 160);
        doc.text(`Total Messages: ${room.messages.length}`, 100, 180);

        let yPosition = 220;
        doc.fontSize(12);

        if (room.messages.length === 0) {
            doc.text('No messages in this room yet.', 100, yPosition);
        } else {
            room.messages.forEach((message, index) => {
                if (yPosition > 700) {
                    doc.addPage();
                    yPosition = 100;
                }

                const timestamp = new Date(message.timestamp).toLocaleString();
                const messageContent = message.content || message.message || '[Media file]';
                doc.text(`[${timestamp}] ${message.username}: ${messageContent}`, 100, yPosition);
                yPosition += 20;
            });
        }

        // For base64 format, collect chunks instead of writing to file
        if (format === 'base64') {
            const chunks = [];
            
            doc.on('data', (chunk) => {
                chunks.push(chunk);
            });

            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const base64Data = pdfBuffer.toString('base64');
                
                res.json({
                    success: true,
                    pdfData: base64Data,
                    filename: filename,
                    roomCode: roomCode
                });
            });
            
            doc.end();
        } else {
            // Original file download behavior
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);
            
            // Handle stream finish event for file download
            doc.end();
            
            stream.on('finish', () => {
                res.download(filepath, filename, (err) => {
                    if (err) {
                        console.error('Error sending file:', err);
                    }
                    // Clean up temporary file
                    fs.unlink(filepath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting temporary file:', unlinkErr);
                        }
                    });
                });
            });
        }

    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Approve or deny admission request
router.post('/:roomCode/admission/:username', authenticateToken, async (req, res) => {
    try {
        const { roomCode, username } = req.params;
        const { decision } = req.body; // 'admit' or 'deny'
        const currentUser = req.user.username;

        const room = await Room.findOne({ roomCode, isActive: true });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check authorization
        const isOwner = room.owner === currentUser;
        const isMember = room.members.find(member => member.username === currentUser);
        
        if (!isOwner && (!isMember || room.admissionType !== 'democratic_voting')) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const pendingIndex = room.pendingMembers.findIndex(member => member.username === username);
        if (pendingIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'No pending request found'
            });
        }

        if (room.admissionType === 'owner_approval' && isOwner) {
            // Owner approval
            room.pendingMembers.splice(pendingIndex, 1);

            if (decision === 'admit') {
                room.addMember(username);
                
                // Notify all room members
                io.to(roomCode).emit('userAdmitted', {
                    username: username,
                    memberCount: room.members.length
                });

                // Notify the admitted user
                io.emit('admissionResult', {
                    roomCode: roomCode,
                    username: username,
                    result: 'admitted'
                });
            } else {
                // Notify the denied user
                io.emit('admissionResult', {
                    roomCode: roomCode,
                    username: username,
                    result: 'denied'
                });
            }

            await room.save();

            return res.json({
                success: true,
                message: `User ${decision === 'admit' ? 'admitted' : 'denied'}`
            });

        } else if (room.admissionType === 'democratic_voting' && isMember) {
            // Democratic voting
            const pendingMember = room.pendingMembers[pendingIndex];
            
            // Check if user already voted
            const existingVote = pendingMember.votes.find(vote => vote.voter === currentUser);
            if (existingVote) {
                existingVote.decision = decision;
            } else {
                pendingMember.votes.push({
                    voter: currentUser,
                    decision: decision
                });
            }

            await room.save();

            // Check if enough votes (simple majority of current members)
            const admitVotes = pendingMember.votes.filter(vote => vote.decision === 'admit').length;
            const denyVotes = pendingMember.votes.filter(vote => vote.decision === 'deny').length;
            const totalVotes = admitVotes + denyVotes;
            const requiredVotes = Math.ceil(room.members.length / 2);

            if (totalVotes >= requiredVotes) {
                const finalDecision = admitVotes > denyVotes ? 'admit' : 'deny';
                
                // Remove from pending
                room.pendingMembers.splice(pendingIndex, 1);

                if (finalDecision === 'admit') {
                    room.addMember(username);
                    
                    // Notify all room members
                    io.to(roomCode).emit('userAdmitted', {
                        username: username,
                        memberCount: room.members.length,
                        voteResult: { admit: admitVotes, deny: denyVotes, total: totalVotes }
                    });

                    // Notify the admitted user
                    io.emit('admissionResult', {
                        roomCode: roomCode,
                        username: username,
                        result: 'admitted'
                    });
                } else {
                    // Notify the denied user
                    io.emit('admissionResult', {
                        roomCode: roomCode,
                        username: username,
                        result: 'denied'
                    });
                }

                await room.save();

                return res.json({
                    success: true,
                    message: `Voting complete. User ${finalDecision === 'admit' ? 'admitted' : 'denied'}`,
                    result: finalDecision,
                    voteResult: { admit: admitVotes, deny: denyVotes, total: totalVotes }
                });
            } else {
                // Update vote status for room members
                io.to(roomCode).emit('voteUpdate', {
                    username: username,
                    voteResult: { admit: admitVotes, deny: denyVotes, total: totalVotes },
                    requiredVotes: requiredVotes
                });

                return res.json({
                    success: true,
                    message: 'Vote recorded',
                    voteResult: { admit: admitVotes, deny: denyVotes, total: totalVotes, required: requiredVotes }
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'Not authorized for this action'
            });
        }

    } catch (error) {
        console.error('Admission decision error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process admission decision'
        });
    }
});

// Remove user from room (owner only)
router.delete('/:roomCode/members/:username', authenticateToken, async (req, res) => {
    try {
        const { roomCode, username } = req.params;
        const currentUser = req.user.username;

        const room = await Room.findOne({ roomCode, isActive: true });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Only room owner can remove users
        if (room.owner !== currentUser) {
            return res.status(403).json({
                success: false,
                message: 'Only the room owner can remove users'
            });
        }

        // Cannot remove owner
        if (username === room.owner) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove the room owner'
            });
        }

        // Check if user is actually a member
        const memberIndex = room.members.findIndex(member => member.username === username);
        if (memberIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'User is not a member of this room'
            });
        }

        // Remove user from room
        room.members.splice(memberIndex, 1);
        await room.save();

        // Emit real-time notifications
        io.to(roomCode).emit('userRemoved', {
            username: username,
            removedBy: currentUser,
            memberCount: room.members.length
        });

        // Notify the removed user specifically
        io.emit('removedFromRoom', {
            roomCode: roomCode,
            username: username,
            removedBy: currentUser
        });

        res.json({
            success: true,
            message: `User ${username} has been removed from the room`,
            memberCount: room.members.length
        });

    } catch (error) {
        console.error('Remove user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove user from room'
        });
    }
});

return router;
};
