const mongoose = require('mongoose');

/**
 * Analytics Schema for tracking system usage and insights
 */

const analyticsSchema = new mongoose.Schema({
    // Event identification
    eventType: {
        type: String,
        required: true,
        enum: [
            'room_created',
            'room_joined',
            'message_sent',
            'media_shared',
            'user_registered',
            'user_login',
            'room_exported',
            'moderation_action',
            'error_occurred'
        ]
    },
    
    // Event details
    eventData: {
        // Room-related data
        roomCode: String,
        roomType: {
            type: String,
            enum: ['demo', 'authenticated', 'scheduled']
        },
        admissionType: String,
        
        // User-related data
        username: String,
        userType: {
            type: String,
            enum: ['demo', 'registered', 'anonymous']
        },
        
        // Message-related data
        messageType: {
            type: String,
            enum: ['text', 'media', 'system']
        },
        mediaType: String, // image, video, audio, document
        messageLength: Number,
        
        // Media-related data
        fileSize: Number,
        fileName: String,
        
        // Error-related data
        errorType: String,
        errorMessage: String,
        
        // Performance data
        responseTime: Number,
        
        // Additional metadata
        metadata: mongoose.Schema.Types.Mixed
    },
    
    // Context information
    context: {
        ipAddress: String,
        userAgent: String,
        sessionId: String,
        referrer: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    
    // Timing information
    timing: {
        serverTime: {
            type: Date,
            default: Date.now
        },
        processTime: Number, // milliseconds
        databaseTime: Number // milliseconds
    },
    
    // Aggregation helpers
    hour: {
        type: Number,
        default: function() {
            return this.timing.serverTime.getHours();
        }
    },
    day: {
        type: Number,
        default: function() {
            return this.timing.serverTime.getDate();
        }
    },
    month: {
        type: Number,
        default: function() {
            return this.timing.serverTime.getMonth() + 1;
        }
    },
    year: {
        type: Number,
        default: function() {
            return this.timing.serverTime.getFullYear();
        }
    },
    dayOfWeek: {
        type: Number,
        default: function() {
            return this.timing.serverTime.getDay();
        }
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
analyticsSchema.index({ eventType: 1, 'timing.serverTime': -1 });
analyticsSchema.index({ 'eventData.roomCode': 1, 'timing.serverTime': -1 });
analyticsSchema.index({ 'eventData.username': 1, 'timing.serverTime': -1 });
analyticsSchema.index({ hour: 1, day: 1, month: 1, year: 1 });
analyticsSchema.index({ eventType: 1, hour: 1, day: 1 });

// TTL index to automatically remove old analytics data (90 days)
analyticsSchema.index({ 'timing.serverTime': 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static methods for analytics operations
analyticsSchema.statics.logEvent = async function(eventType, eventData = {}, context = {}) {
    try {
        const startTime = Date.now();
        
        const analytics = new this({
            eventType,
            eventData,
            context: {
                ...context,
                timestamp: new Date()
            },
            timing: {
                serverTime: new Date(),
                processTime: Date.now() - startTime
            }
        });
        
        await analytics.save();
        return analytics;
    } catch (error) {
        console.error('Analytics logging error:', error);
        // Don't throw error to prevent analytics from breaking app functionality
        return null;
    }
};

analyticsSchema.statics.getDashboardStats = async function(timeRange = '24h') {
    try {
        let startTime;
        const now = new Date();
        
        switch (timeRange) {
            case '1h':
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '7d':
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default: // 24h
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        
        const pipeline = [
            {
                $match: {
                    'timing.serverTime': { $gte: startTime }
                }
            },
            {
                $group: {
                    _id: '$eventType',
                    count: { $sum: 1 },
                    avgResponseTime: { $avg: '$timing.processTime' },
                    uniqueUsers: { $addToSet: '$eventData.username' },
                    uniqueRooms: { $addToSet: '$eventData.roomCode' }
                }
            },
            {
                $project: {
                    eventType: '$_id',
                    count: 1,
                    avgResponseTime: { $round: ['$avgResponseTime', 2] },
                    uniqueUserCount: { $size: '$uniqueUsers' },
                    uniqueRoomCount: { $size: '$uniqueRooms' }
                }
            }
        ];
        
        const stats = await this.aggregate(pipeline);
        
        // Calculate totals
        const totals = stats.reduce((acc, stat) => {
            acc.totalEvents += stat.count;
            acc.totalUsers = Math.max(acc.totalUsers, stat.uniqueUserCount);
            acc.totalRooms = Math.max(acc.totalRooms, stat.uniqueRoomCount);
            return acc;
        }, { totalEvents: 0, totalUsers: 0, totalRooms: 0 });
        
        return {
            timeRange,
            period: { start: startTime, end: now },
            summary: totals,
            breakdown: stats
        };
        
    } catch (error) {
        console.error('Dashboard stats error:', error);
        throw error;
    }
};

analyticsSchema.statics.getHourlyTrends = async function(days = 1) {
    try {
        const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        const pipeline = [
            {
                $match: {
                    'timing.serverTime': { $gte: startTime }
                }
            },
            {
                $group: {
                    _id: {
                        year: '$year',
                        month: '$month',
                        day: '$day',
                        hour: '$hour'
                    },
                    totalEvents: { $sum: 1 },
                    roomsCreated: {
                        $sum: {
                            $cond: [{ $eq: ['$eventType', 'room_created'] }, 1, 0]
                        }
                    },
                    messagesTotal: {
                        $sum: {
                            $cond: [{ $eq: ['$eventType', 'message_sent'] }, 1, 0]
                        }
                    },
                    uniqueUsers: { $addToSet: '$eventData.username' }
                }
            },
            {
                $project: {
                    timestamp: {
                        $dateFromParts: {
                            year: '$_id.year',
                            month: '$_id.month',
                            day: '$_id.day',
                            hour: '$_id.hour'
                        }
                    },
                    totalEvents: 1,
                    roomsCreated: 1,
                    messagesTotal: 1,
                    activeUsers: { $size: '$uniqueUsers' }
                }
            },
            {
                $sort: { timestamp: 1 }
            }
        ];
        
        return await this.aggregate(pipeline);
        
    } catch (error) {
        console.error('Hourly trends error:', error);
        throw error;
    }
};

analyticsSchema.statics.getPopularRooms = async function(timeRange = '24h', limit = 10) {
    try {
        let startTime;
        const now = new Date();
        
        switch (timeRange) {
            case '1h':
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '7d':
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            default: // 24h
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        
        const pipeline = [
            {
                $match: {
                    'timing.serverTime': { $gte: startTime },
                    'eventData.roomCode': { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$eventData.roomCode',
                    totalActivity: { $sum: 1 },
                    messageCount: {
                        $sum: {
                            $cond: [{ $eq: ['$eventType', 'message_sent'] }, 1, 0]
                        }
                    },
                    joinCount: {
                        $sum: {
                            $cond: [{ $eq: ['$eventType', 'room_joined'] }, 1, 0]
                        }
                    },
                    uniqueUsers: { $addToSet: '$eventData.username' },
                    roomType: { $first: '$eventData.roomType' }
                }
            },
            {
                $project: {
                    roomCode: '$_id',
                    totalActivity: 1,
                    messageCount: 1,
                    joinCount: 1,
                    uniqueUserCount: { $size: '$uniqueUsers' },
                    roomType: 1,
                    popularity: {
                        $add: [
                            { $multiply: ['$messageCount', 2] },
                            { $multiply: ['$joinCount', 3] },
                            { $multiply: [{ $size: '$uniqueUsers' }, 5] }
                        ]
                    }
                }
            },
            {
                $sort: { popularity: -1 }
            },
            {
                $limit: limit
            }
        ];
        
        return await this.aggregate(pipeline);
        
    } catch (error) {
        console.error('Popular rooms error:', error);
        throw error;
    }
};

analyticsSchema.statics.getUserEngagement = async function(timeRange = '24h') {
    try {
        let startTime;
        const now = new Date();
        
        switch (timeRange) {
            case '1h':
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '7d':
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            default: // 24h
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        
        const pipeline = [
            {
                $match: {
                    'timing.serverTime': { $gte: startTime },
                    'eventData.username': { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$eventData.username',
                    totalActions: { $sum: 1 },
                    messagesSent: {
                        $sum: {
                            $cond: [{ $eq: ['$eventType', 'message_sent'] }, 1, 0]
                        }
                    },
                    roomsJoined: {
                        $sum: {
                            $cond: [{ $eq: ['$eventType', 'room_joined'] }, 1, 0]
                        }
                    },
                    mediaShared: {
                        $sum: {
                            $cond: [{ $eq: ['$eventType', 'media_shared'] }, 1, 0]
                        }
                    },
                    uniqueRooms: { $addToSet: '$eventData.roomCode' },
                    firstActivity: { $min: '$timing.serverTime' },
                    lastActivity: { $max: '$timing.serverTime' }
                }
            },
            {
                $project: {
                    username: '$_id',
                    totalActions: 1,
                    messagesSent: 1,
                    roomsJoined: 1,
                    mediaShared: 1,
                    uniqueRoomCount: { $size: '$uniqueRooms' },
                    sessionDuration: {
                        $divide: [
                            { $subtract: ['$lastActivity', '$firstActivity'] },
                            1000 * 60 // Convert to minutes
                        ]
                    },
                    engagementScore: {
                        $add: [
                            '$messagesSent',
                            { $multiply: ['$roomsJoined', 2] },
                            { $multiply: ['$mediaShared', 1.5] }
                        ]
                    }
                }
            },
            {
                $sort: { engagementScore: -1 }
            }
        ];
        
        return await this.aggregate(pipeline);
        
    } catch (error) {
        console.error('User engagement error:', error);
        throw error;
    }
};

module.exports = mongoose.model('Analytics', analyticsSchema);
