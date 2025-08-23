const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const Note = require('../models/Note');
const { validateDictionaryWord, authenticateToken } = require('../utils/helpers');
const router = express.Router();

// Create new note
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { title, content, primaryPassword, secondaryPassword } = req.body;
        const username = req.user.username;

        // Validate required fields
        if (!title || !content || !primaryPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Title, content, and primary password are required' 
            });
        }

        // Validate dictionary words
        const isPrimaryValid = await validateDictionaryWord(primaryPassword);
        if (!isPrimaryValid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Primary password must be a valid dictionary word' 
            });
        }

        if (secondaryPassword) {
            const isSecondaryValid = await validateDictionaryWord(secondaryPassword);
            if (!isSecondaryValid) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Secondary password must be a valid dictionary word' 
                });
            }
        }

        // Generate unique note code
        let noteCode;
        let isUnique = false;
        while (!isUnique) {
            noteCode = Note.generateNoteCode();
            const existingNote = await Note.findOne({ noteCode });
            if (!existingNote) {
                isUnique = true;
            }
        }

        // Hash passwords
        const hashedPrimaryPassword = await bcrypt.hash(primaryPassword, 12);
        const hashedSecondaryPassword = secondaryPassword ? await bcrypt.hash(secondaryPassword, 12) : null;

        // Create note
        const note = new Note({
            noteCode,
            title,
            owner: username,
            primaryPassword: hashedPrimaryPassword,
            secondaryPassword: hashedSecondaryPassword,
            noteType: 'text'
        });

        // Encrypt content using primary password
        note.encryptContent(content, primaryPassword);

        await note.save();

        res.status(201).json({
            success: true,
            message: 'Note created successfully',
            note: {
                noteCode: note.noteCode,
                title: note.title,
                noteType: note.noteType,
                createdAt: note.createdAt
            }
        });

    } catch (error) {
        console.error('Note creation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Save PDF export as note
router.post('/save-pdf', authenticateToken, async (req, res) => {
    try {
        const { title, primaryPassword, secondaryPassword, pdfData, roomCode } = req.body;
        const username = req.user.username;

        // Validate required fields
        if (!title || !primaryPassword || !pdfData) {
            return res.status(400).json({ 
                success: false, 
                message: 'Title, primary password, and PDF data are required' 
            });
        }

        // Validate dictionary words
        const isPrimaryValid = await validateDictionaryWord(primaryPassword);
        if (!isPrimaryValid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Primary password must be a valid dictionary word' 
            });
        }

        if (secondaryPassword) {
            const isSecondaryValid = await validateDictionaryWord(secondaryPassword);
            if (!isSecondaryValid) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Secondary password must be a valid dictionary word' 
                });
            }
        }

        // Generate unique note code
        let noteCode;
        let isUnique = false;
        while (!isUnique) {
            noteCode = Note.generateNoteCode();
            const existingNote = await Note.findOne({ noteCode });
            if (!existingNote) {
                isUnique = true;
            }
        }

        // Save PDF file
        const pdfDir = path.join(__dirname, '../storage/pdfs');
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
        }

        const filename = `${noteCode}_${Date.now()}.pdf`;
        const filepath = path.join(pdfDir, filename);
        
        // Decode base64 PDF data and save
        const pdfBuffer = Buffer.from(pdfData, 'base64');
        fs.writeFileSync(filepath, pdfBuffer);

        // Create note
        const note = new Note({
            noteCode,
            title,
            content: `Chat export from room: ${roomCode || 'Unknown'}`,
            owner: username,
            primaryPassword,
            secondaryPassword,
            noteType: 'pdf',
            pdfPath: filepath
        });

        await note.save();

        res.status(201).json({
            success: true,
            message: 'PDF saved to notes successfully',
            note: {
                noteCode: note.noteCode,
                title: note.title,
                noteType: note.noteType,
                createdAt: note.createdAt
            }
        });

    } catch (error) {
        console.error('PDF save error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Access note
router.post('/:noteCode/access', authenticateToken, async (req, res) => {
    try {
        const { noteCode } = req.params;
        const { primaryPassword, secondaryPassword } = req.body;
        const username = req.user.username;

        // Find note
        const note = await Note.findOne({ noteCode });
        if (!note) {
            return res.status(404).json({ 
                success: false, 
                message: 'Note not found' 
            });
        }

        // Check ownership
        if (note.owner !== username) {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only access your own notes' 
            });
        }

        // Validate passwords and decrypt content
        let decryptedContent;
        const providedPassword = primaryPassword || secondaryPassword;

        try {
            decryptedContent = await note.getDecryptedContent(providedPassword);
        } catch (error) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid password' 
            });
        }

        // Check if secondary password is required but not provided
        if (note.secondaryPassword && !secondaryPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Secondary password required' 
            });
        }

        // Return note content
        const responseNote = {
            noteCode: note.noteCode,
            title: note.title,
            content: decryptedContent,
            noteType: note.noteType,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
        };

        res.json({
            success: true,
            note: responseNote
        });

    } catch (error) {
        console.error('Note access error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Update note
router.put('/:noteCode/update', authenticateToken, async (req, res) => {
    try {
        const { noteCode } = req.params;
        const { title, content, primaryPassword, secondaryPassword } = req.body;
        const username = req.user.username;

        // Find note
        const note = await Note.findOne({ noteCode });
        if (!note) {
            return res.status(404).json({ 
                success: false, 
                message: 'Note not found' 
            });
        }

        // Check ownership
        if (note.owner !== username) {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only update your own notes' 
            });
        }

        // Validate current passwords first
        if (primaryPassword !== note.primaryPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid primary password' 
            });
        }

        if (note.secondaryPassword && secondaryPassword !== note.secondaryPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid secondary password' 
            });
        }

        // Update note
        if (title) note.title = title;
        if (content) note.content = content;

        await note.save();

        res.json({
            success: true,
            message: 'Note updated successfully',
            note: {
                noteCode: note.noteCode,
                title: note.title,
                noteType: note.noteType,
                updatedAt: note.updatedAt
            }
        });

    } catch (error) {
        console.error('Note update error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Delete note
router.delete('/:noteCode/delete', authenticateToken, async (req, res) => {
    try {
        const { noteCode } = req.params;
        const { primaryPassword, secondaryPassword } = req.body;
        const username = req.user.username;

        // Find note
        const note = await Note.findOne({ noteCode });
        if (!note) {
            return res.status(404).json({ 
                success: false, 
                message: 'Note not found' 
            });
        }

        // Check ownership
        if (note.owner !== username) {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only delete your own notes' 
            });
        }

        // Validate passwords
        if (primaryPassword !== note.primaryPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid primary password' 
            });
        }

        if (note.secondaryPassword && secondaryPassword !== note.secondaryPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid secondary password' 
            });
        }

        // Delete PDF file if exists
        if (note.noteType === 'pdf' && note.pdfPath && fs.existsSync(note.pdfPath)) {
            fs.unlinkSync(note.pdfPath);
        }

        // Delete note
        await Note.findByIdAndDelete(note._id);

        res.json({
            success: true,
            message: 'Note deleted successfully'
        });

    } catch (error) {
        console.error('Note deletion error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Download PDF note
router.get('/:noteCode/download', authenticateToken, async (req, res) => {
    try {
        const { noteCode } = req.params;
        const { primaryPassword, secondaryPassword } = req.query;
        const username = req.user.username;

        // Find note
        const note = await Note.findOne({ noteCode });
        if (!note) {
            return res.status(404).json({ 
                success: false, 
                message: 'Note not found' 
            });
        }

        // Check ownership
        if (note.owner !== username) {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only download your own notes' 
            });
        }

        // Validate passwords
        if (primaryPassword !== note.primaryPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid primary password' 
            });
        }

        if (note.secondaryPassword && secondaryPassword !== note.secondaryPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid secondary password' 
            });
        }

        // Check if it's a PDF note
        if (note.noteType !== 'pdf' || !note.pdfPath) {
            return res.status(400).json({ 
                success: false, 
                message: 'This note is not a PDF or file not found' 
            });
        }

        // Check if file exists
        if (!fs.existsSync(note.pdfPath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'PDF file not found' 
            });
        }

        // Send file
        const filename = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        res.download(note.pdfPath, filename);

    } catch (error) {
        console.error('PDF download error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

module.exports = router;
