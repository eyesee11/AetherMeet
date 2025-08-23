const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    activeSessions: [{
        token: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: true
        },
        deviceInfo: {
            type: String,
            default: 'Unknown Device'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Add active session
userSchema.methods.addSession = async function(token, expiresAt, deviceInfo = 'Unknown Device') {
    // Remove expired sessions first
    this.activeSessions = this.activeSessions.filter(session => 
        new Date(session.expiresAt) > new Date()
    );
    
    // Add new session
    this.activeSessions.push({
        token,
        expiresAt,
        deviceInfo,
        createdAt: new Date()
    });
    
    await this.save();
    return this;
};

// Remove session by token
userSchema.methods.removeSession = async function(token) {
    this.activeSessions = this.activeSessions.filter(session => session.token !== token);
    await this.save();
    return this;
};

// Remove all sessions (logout from all devices)
userSchema.methods.removeAllSessions = async function() {
    this.activeSessions = [];
    await this.save();
    return this;
};

// Check if token is valid/active
userSchema.methods.isTokenValid = function(token) {
    const session = this.activeSessions.find(session => 
        session.token === token && new Date(session.expiresAt) > new Date()
    );
    return !!session;
};

// Clean expired sessions
userSchema.methods.cleanExpiredSessions = async function() {
    const now = new Date();
    this.activeSessions = this.activeSessions.filter(session => 
        new Date(session.expiresAt) > now
    );
    await this.save();
    return this;
};

module.exports = mongoose.model('User', userSchema);
