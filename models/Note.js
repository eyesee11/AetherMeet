const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const noteSchema = new mongoose.Schema({
    noteCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        length: 6
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    content: {
        type: String,
        required: true,
        maxlength: 50000 // Increased to accommodate encrypted content
    },
    encryptionIV: {
        type: String,
        default: null
    },
    encryptionSalt: {
        type: String,
        default: null
    },
    owner: {
        type: String,
        required: true
    },
    primaryPassword: {
        type: String,
        required: true
    },
    secondaryPassword: {
        type: String,
        default: null
    },
    noteType: {
        type: String,
        enum: ['text', 'pdf'],
        default: 'text'
    },
    pdfPath: {
        type: String,
        default: null
    },
    isEncrypted: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Generate unique note code
noteSchema.statics.generateNoteCode = function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Update timestamp on save
noteSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Encrypt content before saving
noteSchema.methods.encryptContent = function(content, password) {
    try {
        // Generate salt and IV
        const salt = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);
        
        // Derive key from password using PBKDF2
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
        
        // Encrypt content
        const cipher = crypto.createCipher('aes-256-cbc', key);
        cipher.setAutoPadding(true);
        
        let encrypted = cipher.update(content, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Store encrypted data and salt/IV
        this.content = encrypted;
        this.encryptionSalt = salt.toString('hex');
        this.encryptionIV = iv.toString('hex');
        this.isEncrypted = true;
        
        return this;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt content');
    }
};

// Decrypt content
noteSchema.methods.decryptContent = function(password) {
    try {
        if (!this.isEncrypted || !this.encryptionSalt || !this.encryptionIV) {
            return this.content; // Return as-is if not encrypted
        }
        
        // Reconstruct salt and IV
        const salt = Buffer.from(this.encryptionSalt, 'hex');
        const iv = Buffer.from(this.encryptionIV, 'hex');
        
        // Derive key from password
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
        
        // Decrypt content
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        decipher.setAutoPadding(true);
        
        let decrypted = decipher.update(this.content, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt content - invalid password or corrupted data');
    }
};

// Verify password and decrypt content
noteSchema.methods.getDecryptedContent = async function(password) {
    try {
        // Check primary password
        const isPrimaryValid = await bcrypt.compare(password, this.primaryPassword);
        if (isPrimaryValid) {
            return this.decryptContent(password);
        }
        
        // Check secondary password if it exists
        if (this.secondaryPassword) {
            const isSecondaryValid = await bcrypt.compare(password, this.secondaryPassword);
            if (isSecondaryValid) {
                return this.decryptContent(password);
            }
        }
        
        throw new Error('Invalid password');
    } catch (error) {
        throw error;
    }
};

module.exports = mongoose.model('Note', noteSchema);
