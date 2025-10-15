const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// General API rate limiting
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiting for room creation
const roomCreationLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.ROOM_CREATION_LIMIT) || 5, // Limit each IP to 5 room creations per windowMs
    message: {
        error: 'Too many rooms created from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.AUTH_LIMIT) || 10, // Limit each IP to 10 auth attempts per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Media upload rate limiting
const mediaUploadLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.MEDIA_UPLOAD_LIMIT) || 20, // Limit each IP to 20 uploads per windowMs
    message: {
        error: 'Too many file uploads, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Phase 3: Admin operations rate limiting
const adminLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // Higher limit for admin operations
    message: {
        error: 'Too many admin requests, please try again later.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Phase 3: API analytics rate limiting
const analyticsLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute for analytics
    message: {
        error: 'Too many analytics requests, please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Helmet configuration for security headers
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://fonts.googleapis.com",
                "https://cdn.tailwindcss.com"
            ],
            fontSrc: [
                "'self'", 
                "https://fonts.gstatic.com"
            ],
            imgSrc: [
                "'self'", 
                "data:", 
                "blob:"
            ],
            mediaSrc: [
                "'self'", 
                "blob:"
            ],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'",
                "https://cdn.tailwindcss.com",
                "https://cdn.socket.io"
            ],
            connectSrc: [
                "'self'", 
                "ws:", 
                "wss:",
                "ws://localhost:*",
                "wss://localhost:*",
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com"
            ],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false, // Allows media uploads
});

// Input sanitization function
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters and scripts
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocols
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
};

// Validate room code format
const validateRoomCode = (roomCode) => {
    const roomCodeRegex = /^[A-Z0-9]{6}$/;
    return roomCodeRegex.test(roomCode);
};

// Validate file uploads
const validateFileUpload = (file) => {
    const allowedTypesEnv = process.env.ALLOWED_FILE_TYPES || '';
    const allowedTypes = allowedTypesEnv ? allowedTypesEnv.split(',') : [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg',
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
        'application/pdf', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50MB max file size
    
    if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('File type not allowed');
    }
    
    if (file.size > maxSize) {
        throw new Error(`File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    
    return true;
};

// Phase 3: Advanced security functions
const validateEncryption = (encryptedData) => {
    if (!encryptedData || typeof encryptedData !== 'object') {
        throw new Error('Invalid encrypted data format');
    }
    
    const requiredFields = ['encrypted', 'iv', 'authTag', 'algorithm'];
    for (const field of requiredFields) {
        if (!encryptedData[field]) {
            throw new Error(`Missing required encryption field: ${field}`);
        }
    }
    
    return true;
};

const validateModerationAction = (action, reason, duration) => {
    const validActions = ['warn', 'mute', 'kick', 'ban', 'restrict_media', 'delete_message'];
    
    if (!validActions.includes(action)) {
        throw new Error('Invalid moderation action');
    }
    
    if (!reason || reason.trim().length < 3) {
        throw new Error('Moderation reason must be at least 3 characters');
    }
    
    if (duration && (isNaN(duration) || duration < 0 || duration > 525600)) { // Max 1 year
        throw new Error('Invalid duration. Must be between 0 and 525600 minutes (1 year)');
    }
    
    return true;
};

const validateLanguageCode = (languageCode) => {
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
    
    if (!supportedLanguages.includes(languageCode)) {
        throw new Error('Unsupported language code');
    }
    
    return true;
};

const validateAnalyticsTimeRange = (timeRange) => {
    const validRanges = ['1h', '24h', '7d', '30d'];
    
    if (!validRanges.includes(timeRange)) {
        throw new Error('Invalid time range. Must be one of: 1h, 24h, 7d, 30d');
    }
    
    return true;
};

// Security audit logging
const logSecurityEvent = (eventType, details, req) => {
    const securityLog = {
        timestamp: new Date(),
        eventType,
        details,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.username || 'anonymous'
    };
    
    console.log('SECURITY EVENT:', JSON.stringify(securityLog));
    
    // In production, you would save this to a dedicated security log collection
    // or send to a security monitoring service
};

// Enhanced input sanitization for Phase 3
const sanitizeAdvanced = (input, options = {}) => {
    if (typeof input !== 'string') return input;
    
    let sanitized = input;
    
    // Basic sanitization
    sanitized = sanitizeInput(sanitized);
    
    // Additional Phase 3 sanitizations
    if (options.allowHTML === false) {
        sanitized = sanitized.replace(/<[^>]*>/g, ''); // Remove all HTML tags
    }
    
    if (options.maxLength) {
        sanitized = sanitized.substring(0, options.maxLength);
    }
    
    if (options.alphanumericOnly) {
        sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, '');
    }
    
    return sanitized;
};

module.exports = {
    generalLimiter,
    roomCreationLimiter,
    authLimiter,
    mediaUploadLimiter,
    adminLimiter,
    analyticsLimiter,
    helmetConfig,
    sanitizeInput,
    sanitizeAdvanced,
    validateRoomCode,
    validateFileUpload,
    validateEncryption,
    validateModerationAction,
    validateLanguageCode,
    validateAnalyticsTimeRange,
    logSecurityEvent
};
