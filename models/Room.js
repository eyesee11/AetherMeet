const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        length: 6,
        index: true
    },
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500
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
    isScheduled: {
        type: Boolean,
        default: false
    },
    scheduledTime: {
        type: Date,
        default: null
    },
    admissionType: {
        type: String,
        enum: ['owner_approval', 'democratic_voting', 'instant_entry'],
        default: 'owner_approval'
    },
    isDemoRoom: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        default: null
    },
    members: [{
        username: String,
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    pendingMembers: [{
        username: String,
        votes: [{
            voter: String,
            decision: {
                type: String,
                enum: ['admit', 'deny']
            }
        }],
        requestedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Phase 3: Advanced moderation features
    moderators: [String], // Array of moderator usernames
    mutedUsers: [{
        username: String,
        mutedAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: Date,
        isPermanent: {
            type: Boolean,
            default: false
        }
    }],
    bannedUsers: [{
        username: String,
        bannedAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: Date,
        isPermanent: {
            type: Boolean,
            default: false
        }
    }],
    mediaRestrictedUsers: [{
        username: String,
        restrictedAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: Date,
        isPermanent: {
            type: Boolean,
            default: false
        }
    }],
    moderationLog: [{
        targetUsername: String,
        moderatorUsername: String,
        action: {
            type: String,
            enum: ['warn', 'mute', 'kick', 'ban', 'restrict_media', 'delete_message']
        },
        reason: String,
        duration: Number, // in minutes
        timestamp: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true
        },
        expiresAt: Date
    }],
    // Phase 3: End-to-end encryption
    encryption: {
        isEnabled: {
            type: Boolean,
            default: false
        },
        roomKey: String, // Encrypted room key
        keyRotationCount: {
            type: Number,
            default: 0
        },
        lastKeyRotation: {
            type: Date,
            default: Date.now
        }
    },
    // Phase 3: Analytics and insights
    analytics: {
        totalMessages: {
            type: Number,
            default: 0
        },
        totalMediaFiles: {
            type: Number,
            default: 0
        },
        peakConcurrentUsers: {
            type: Number,
            default: 0
        },
        totalJoins: {
            type: Number,
            default: 0
        },
        averageSessionDuration: {
            type: Number,
            default: 0 // in minutes
        },
        popularityScore: {
            type: Number,
            default: 0
        }
    },
    // Phase 3: Room settings and preferences
    settings: {
        maxMembers: {
            type: Number,
            default: 50
        },
        messageRetentionDays: {
            type: Number,
            default: 30
        },
        allowFileUploads: {
            type: Boolean,
            default: true
        },
        allowedFileTypes: {
            type: [String],
            default: ['image', 'video', 'audio', 'document']
        },
        maxFileSize: {
            type: Number,
            default: 50 * 1024 * 1024 // 50MB in bytes
        },
        language: {
            type: String,
            default: 'en'
        },
        autoDeleteMessages: {
            type: Boolean,
            default: false
        },
        allowGuestUsers: {
            type: Boolean,
            default: true
        }
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    destroyedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
roomSchema.index({ roomCode: 1, isActive: 1 });
roomSchema.index({ owner: 1, isActive: 1 });
roomSchema.index({ isDemoRoom: 1, expiresAt: 1 });
roomSchema.index({ createdAt: -1 });

// TTL index for demo room auto-cleanup
roomSchema.index({ expiresAt: 1 }, { 
    expireAfterSeconds: 0,
    partialFilterExpression: { isDemoRoom: true }
});

// Generate unique room code
roomSchema.statics.generateRoomCode = function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Add member to room
roomSchema.methods.addMember = function(username) {
    if (!this.members.find(member => member.username === username)) {
        this.members.push({ username });
    }
};

// Remove member from room
roomSchema.methods.removeMember = function(username) {
    this.members = this.members.filter(member => member.username !== username);
};

// Transfer ownership
roomSchema.methods.transferOwnership = function() {
    if (this.members.length > 0) {
        // Transfer to the next member who joined
        const nextOwner = this.members.sort((a, b) => a.joinedAt - b.joinedAt)[0];
        this.owner = nextOwner.username;
        return nextOwner.username;
    }
    return null;
};

// Phase 3: Advanced room methods
roomSchema.methods.updateAnalytics = function(action, data = {}) {
    switch (action) {
        case 'message_sent':
            this.analytics.totalMessages++;
            break;
        case 'media_shared':
            this.analytics.totalMediaFiles++;
            break;
        case 'user_joined':
            this.analytics.totalJoins++;
            this.analytics.peakConcurrentUsers = Math.max(
                this.analytics.peakConcurrentUsers,
                this.members.length
            );
            break;
        case 'session_duration':
            const sessionCount = this.analytics.totalJoins || 1;
            this.analytics.averageSessionDuration = 
                (this.analytics.averageSessionDuration * (sessionCount - 1) + (data.duration || 0)) / sessionCount;
            break;
    }
    
    // Update popularity score
    this.analytics.popularityScore = this.calculatePopularityScore();
};

roomSchema.methods.calculatePopularityScore = function() {
    const weights = {
        messages: 1,
        mediaFiles: 2,
        peakUsers: 5,
        totalJoins: 3,
        avgSession: 0.1
    };
    
    return (
        this.analytics.totalMessages * weights.messages +
        this.analytics.totalMediaFiles * weights.mediaFiles +
        this.analytics.peakConcurrentUsers * weights.peakUsers +
        this.analytics.totalJoins * weights.totalJoins +
        this.analytics.averageSessionDuration * weights.avgSession
    );
};

roomSchema.methods.enableEncryption = function(roomKey) {
    this.encryption.isEnabled = true;
    this.encryption.roomKey = roomKey;
    this.encryption.lastKeyRotation = new Date();
};

roomSchema.methods.rotateEncryptionKey = function(newRoomKey) {
    if (this.encryption.isEnabled) {
        this.encryption.roomKey = newRoomKey;
        this.encryption.keyRotationCount++;
        this.encryption.lastKeyRotation = new Date();
    }
};

roomSchema.methods.addModerator = function(username) {
    if (!this.moderators) {
        this.moderators = [];
    }
    if (!this.moderators.includes(username) && username !== this.owner) {
        this.moderators.push(username);
    }
};

roomSchema.methods.removeModerator = function(username) {
    if (this.moderators) {
        this.moderators = this.moderators.filter(mod => mod !== username);
    }
};

roomSchema.methods.isModerator = function(username) {
    return this.owner === username || (this.moderators && this.moderators.includes(username));
};

roomSchema.methods.updateSettings = function(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
};

roomSchema.methods.cleanupExpiredModerations = function() {
    const now = new Date();
    
    // Clean expired mutes
    if (this.mutedUsers) {
        this.mutedUsers = this.mutedUsers.filter(mute =>
            mute.isPermanent || !mute.expiresAt || mute.expiresAt > now
        );
    }
    
    // Clean expired bans
    if (this.bannedUsers) {
        this.bannedUsers = this.bannedUsers.filter(ban =>
            ban.isPermanent || !ban.expiresAt || ban.expiresAt > now
        );
    }
    
    // Clean expired media restrictions
    if (this.mediaRestrictedUsers) {
        this.mediaRestrictedUsers = this.mediaRestrictedUsers.filter(restriction =>
            restriction.isPermanent || !restriction.expiresAt || restriction.expiresAt > now
        );
    }
};

module.exports = mongoose.model('Room', roomSchema);
