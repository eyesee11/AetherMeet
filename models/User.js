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
    // Phase 3: Advanced Features
    isAdmin: {
        type: Boolean,
        default: false
    },
    preferences: {
        language: {
            type: String,
            default: 'en',
            enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']
        },
        theme: {
            type: String,
            default: 'light',
            enum: ['light', 'dark', 'auto']
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            },
            sound: {
                type: Boolean,
                default: true
            }
        },
        privacy: {
            showOnlineStatus: {
                type: Boolean,
                default: true
            },
            allowDirectMessages: {
                type: Boolean,
                default: true
            },
            showProfileToOthers: {
                type: Boolean,
                default: true
            }
        }
    },
    // End-to-end encryption keys
    encryption: {
        publicKey: String,
        privateKeyHash: String, // Encrypted private key
        keyRotationDate: {
            type: Date,
            default: Date.now
        }
    },
    // Analytics and engagement
    analytics: {
        totalRoomsCreated: {
            type: Number,
            default: 0
        },
        totalRoomsJoined: {
            type: Number,
            default: 0
        },
        totalMessagesSent: {
            type: Number,
            default: 0
        },
        totalMediaShared: {
            type: Number,
            default: 0
        },
        lastActiveAt: {
            type: Date,
            default: Date.now
        },
        totalSessionTime: {
            type: Number,
            default: 0 // in minutes
        },
        engagementScore: {
            type: Number,
            default: 0
        }
    },
    // Moderation history
    moderationHistory: [{
        action: {
            type: String,
            enum: ['warned', 'muted', 'kicked', 'banned', 'restricted']
        },
        reason: String,
        roomCode: String,
        moderatorUsername: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        duration: Number, // in minutes
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    // Account status
    accountStatus: {
        isActive: {
            type: Boolean,
            default: true
        },
        isSuspended: {
            type: Boolean,
            default: false
        },
        suspensionReason: String,
        suspensionExpiresAt: Date,
        emailVerified: {
            type: Boolean,
            default: false
        },
        emailVerificationToken: String,
        passwordResetToken: String,
        passwordResetExpiresAt: Date
    },
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

// Phase 3: Advanced user methods
userSchema.methods.updatePreferences = async function(preferences) {
    this.preferences = { ...this.preferences, ...preferences };
    await this.save();
    return this;
};

userSchema.methods.updateAnalytics = async function(action, data = {}) {
    switch (action) {
        case 'room_created':
            this.analytics.totalRoomsCreated++;
            break;
        case 'room_joined':
            this.analytics.totalRoomsJoined++;
            break;
        case 'message_sent':
            this.analytics.totalMessagesSent++;
            break;
        case 'media_shared':
            this.analytics.totalMediaShared++;
            break;
        case 'session_time':
            this.analytics.totalSessionTime += data.minutes || 0;
            break;
    }
    
    this.analytics.lastActiveAt = new Date();
    this.analytics.engagementScore = this.calculateEngagementScore();
    await this.save();
    return this;
};

userSchema.methods.calculateEngagementScore = function() {
    const weights = {
        roomsCreated: 5,
        roomsJoined: 2,
        messagesSent: 1,
        mediaShared: 3,
        sessionTime: 0.1
    };
    
    return (
        this.analytics.totalRoomsCreated * weights.roomsCreated +
        this.analytics.totalRoomsJoined * weights.roomsJoined +
        this.analytics.totalMessagesSent * weights.messagesSent +
        this.analytics.totalMediaShared * weights.mediaShared +
        this.analytics.totalSessionTime * weights.sessionTime
    );
};

userSchema.methods.addModerationRecord = async function(action, reason, roomCode, moderatorUsername, duration = null) {
    this.moderationHistory.push({
        action,
        reason,
        roomCode,
        moderatorUsername,
        duration,
        timestamp: new Date()
    });
    
    // Keep only last 100 moderation records
    if (this.moderationHistory.length > 100) {
        this.moderationHistory = this.moderationHistory.slice(-100);
    }
    
    await this.save();
    return this;
};

userSchema.methods.setEncryptionKeys = async function(publicKey, encryptedPrivateKey) {
    this.encryption.publicKey = publicKey;
    this.encryption.privateKeyHash = encryptedPrivateKey;
    this.encryption.keyRotationDate = new Date();
    await this.save();
    return this;
};

userSchema.methods.rotateEncryptionKeys = async function(newPublicKey, newEncryptedPrivateKey) {
    this.encryption.publicKey = newPublicKey;
    this.encryption.privateKeyHash = newEncryptedPrivateKey;
    this.encryption.keyRotationDate = new Date();
    await this.save();
    return this;
};

userSchema.methods.suspendAccount = async function(reason, duration = null) {
    this.accountStatus.isSuspended = true;
    this.accountStatus.suspensionReason = reason;
    if (duration) {
        this.accountStatus.suspensionExpiresAt = new Date(Date.now() + duration * 60 * 1000);
    }
    await this.save();
    return this;
};

userSchema.methods.unsuspendAccount = async function() {
    this.accountStatus.isSuspended = false;
    this.accountStatus.suspensionReason = undefined;
    this.accountStatus.suspensionExpiresAt = undefined;
    await this.save();
    return this;
};

module.exports = mongoose.model('User', userSchema);
