const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },
    username: {
        type: String,
        required: true,
        index: true
    },
    content: {
        type: String,
        required: function() {
            return this.messageType === 'text';
        },
        maxlength: 1000
    },
    messageType: {
        type: String,
        enum: ['text', 'audio', 'image', 'video', 'file', 'system'],
        default: 'text',
        index: true
    },
    mediaUrl: {
        type: String,
        default: null
    },
    mediaName: {
        type: String,
        default: null
    },
    mediaSize: {
        type: Number,
        default: null
    },
    audioDuration: {
        type: Number,
        default: null
    },
    metadata: {
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: null
        },
        editedAt: {
            type: Date,
            default: null
        },
        reactions: [{
            username: String,
            emoji: String,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }]
    },
    timestamp: {
        type: Date,
        default: Date.now
        // Removed individual index - will be handled by compound indexes below
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
messageSchema.index({ roomId: 1, timestamp: -1 });
messageSchema.index({ roomId: 1, messageType: 1 });
messageSchema.index({ username: 1, timestamp: -1 });

// TTL index for automatic cleanup (optional - for demo rooms)
messageSchema.index({ timestamp: 1 }, { 
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { messageType: { $ne: 'system' } }
});

// Virtual for formatted timestamp
messageSchema.virtual('formattedTimestamp').get(function() {
    return this.timestamp.toLocaleString();
});

// Method to check if message can be edited
messageSchema.methods.canEdit = function(username) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.username === username && 
           this.messageType === 'text' && 
           this.timestamp > fiveMinutesAgo;
};

// Method to check if message can be deleted
messageSchema.methods.canDelete = function(username, isRoomOwner = false) {
    return this.username === username || isRoomOwner;
};

// Static method to get room messages with pagination
messageSchema.statics.getRoomMessages = function(roomId, limit = 50, before = null) {
    const query = { 
        roomId: roomId, 
        isDeleted: false 
    };
    
    if (before) {
        query.timestamp = { $lt: before };
    }
    
    return this.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
};

// Static method to get message count for a room
messageSchema.statics.getMessageCount = function(roomId) {
    return this.countDocuments({ roomId: roomId, isDeleted: false });
};

module.exports = mongoose.model('Message', messageSchema);
