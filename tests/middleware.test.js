const {
    sanitizeInput,
    validateRoomCode,
    validateFileUpload,
    validateModerationAction,
    validateLanguageCode,
    validateAnalyticsTimeRange,
    sanitizeAdvanced
} = require('../middleware/security');

describe('Security Middleware Tests', () => {
    // input sanitization
    describe('sanitizeInput', () => {

        test('should remove script tags from input', () => {
            // test input
            const input = '<script>alert("xss")</script>Hello';
            const result = sanitizeInput(input);
            expect(result).not.toContain('<script>');
            expect(result).toContain('Hello');
        });

        test('should remove javascript: protocol', () => {
            const input = 'javascript:alert("xss")';
            const result = sanitizeInput(input);
            expect(result).not.toContain('javascript:');
        });

        test('should remove event handlers', () => {
            const input = '<div onclick="alert()">Click</div>';
            const result = sanitizeInput(input);
            expect(result).not.toContain('onclick=');
        });

        test('should return non-string values unchanged', () => {
            expect(sanitizeInput(123)).toBe(123);
            expect(sanitizeInput(null)).toBe(null);
        });
    });

    describe('validateRoomCode', () => {

        test('should validate correct room code format', () => {
            // valid codes
            expect(validateRoomCode('ROOM01')).toBe(true);
            expect(validateRoomCode('ABC123')).toBe(true);
        });

        test('should reject invalid room code formats', () => {
            expect(validateRoomCode('room01')).toBe(false);
            expect(validateRoomCode('ROOM')).toBe(false);
            expect(validateRoomCode('ROOM001')).toBe(false);
            expect(validateRoomCode('ROOM-1')).toBe(false);
        });
    });

    describe('validateFileUpload', () => {

        test('should accept allowed image file types', () => {
            // valid file
            const file = {
                mimetype: 'image/jpeg',
                size: 1024 * 1024
            };
            expect(() => validateFileUpload(file)).not.toThrow();
        });

        test('should accept allowed document types', () => {
            const file = {
                mimetype: 'application/pdf',
                size: 1024 * 1024
            };
            expect(() => validateFileUpload(file)).not.toThrow();
        });

        test('should reject disallowed file types', () => {
            const file = {
                mimetype: 'application/x-executable',
                size: 1024
            };
            expect(() => validateFileUpload(file)).toThrow('File type not allowed');
        });

        test('should reject files that are too large', () => {
            const file = {
                mimetype: 'image/jpeg',
                size: 100 * 1024 * 1024
            };
            expect(() => validateFileUpload(file)).toThrow(/File size too large/);
        });
    });

    describe('validateModerationAction', () => {

        test('should accept valid moderation actions', () => {
            // valid actions
            expect(() => validateModerationAction('warn', 'Spam', 60)).not.toThrow();
            expect(() => validateModerationAction('mute', 'Offensive language', 30)).not.toThrow();
            expect(() => validateModerationAction('kick', 'Rule violation', 0)).not.toThrow();
        });

        test('should reject invalid action types', () => {
            expect(() => validateModerationAction('invalid', 'Reason', 60))
                .toThrow('Invalid moderation action');
        });

        test('should reject short reasons', () => {
            expect(() => validateModerationAction('warn', 'ab', 60))
                .toThrow('Moderation reason must be at least 3 characters');
        });

        test('should reject invalid duration values', () => {
            expect(() => validateModerationAction('mute', 'Reason', -10))
                .toThrow('Invalid duration');
            expect(() => validateModerationAction('mute', 'Reason', 999999))
                .toThrow('Invalid duration');
        });
    });

    describe('validateLanguageCode', () => {

        test('should accept supported language codes', () => {
            // valid languages
            expect(() => validateLanguageCode('en')).not.toThrow();
            expect(() => validateLanguageCode('es')).not.toThrow();
            expect(() => validateLanguageCode('fr')).not.toThrow();
        });

        test('should reject unsupported language codes', () => {
            expect(() => validateLanguageCode('xx'))
                .toThrow('Unsupported language code');
            expect(() => validateLanguageCode('invalid'))
                .toThrow('Unsupported language code');
        });
    });

    describe('validateAnalyticsTimeRange', () => {

        test('should accept valid time ranges', () => {
            expect(() => validateAnalyticsTimeRange('1h')).not.toThrow();
            expect(() => validateAnalyticsTimeRange('24h')).not.toThrow();
            expect(() => validateAnalyticsTimeRange('7d')).not.toThrow();
            expect(() => validateAnalyticsTimeRange('30d')).not.toThrow();
        });

        test('should reject invalid time ranges', () => {
            expect(() => validateAnalyticsTimeRange('1d'))
                .toThrow('Invalid time range');
            expect(() => validateAnalyticsTimeRange('invalid'))
                .toThrow('Invalid time range');
        });
    });

    describe('sanitizeAdvanced', () => {

        test('should apply basic sanitization', () => {
            const input = '<script>alert("test")</script>Hello';
            const result = sanitizeAdvanced(input);
            expect(result).not.toContain('<script>');
        });

        test('should remove all HTML when allowHTML is false', () => {
            // remove HTML
            const input = '<div>Hello <b>World</b></div>';
            const result = sanitizeAdvanced(input, { allowHTML: false });
            expect(result).not.toContain('<');
            expect(result).not.toContain('>');
            expect(result).toContain('Hello');
            expect(result).toContain('World');
        });

        test('should enforce maxLength option', () => {
            const input = 'This is a very long string';
            const result = sanitizeAdvanced(input, { maxLength: 10 });
            expect(result.length).toBe(10);
        });

        test('should keep only alphanumeric when option set', () => {
            const input = 'Hello@World!123';
            const result = sanitizeAdvanced(input, { alphanumericOnly: true });
            expect(result).not.toContain('@');
            expect(result).not.toContain('!');
            expect(result).toContain('Hello');
            expect(result).toContain('World');
            expect(result).toContain('123');
        });
    });
});
