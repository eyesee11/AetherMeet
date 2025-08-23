const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
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
        enum: ['text', 'audio', 'image', 'video', 'file'],
        default: 'text'
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
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const roomSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        length: 6
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
    messages: [messageSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    destroyedAt: {
        type: Date,
        default: null
    }
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

module.exports = mongoose.model('Room', roomSchema);
