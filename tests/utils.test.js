const {
    generateSecureCode,
    validateRoomCode,
    sanitizeInput,
    calculateVoteResult,
    validatePassword,
    isRoomMember
} = require('../utils/helpers');

describe('Utility Functions Tests', () => {
    // code generation
    describe('generateSecureCode', () => {

        test('should generate a 6-character code by default', () => {
            // generate code
            const code = generateSecureCode();
            expect(code).toHaveLength(6);
        });

        test('should generate code with only uppercase letters and numbers', () => {
            const code = generateSecureCode();
            expect(code).toMatch(/^[A-Z0-9]+$/);
        });

        test('should generate different codes each time', () => {
            const code1 = generateSecureCode();
            const code2 = generateSecureCode();
            expect(code1).not.toBe(code2);
        });

        test('should generate code with custom length', () => {
            const code = generateSecureCode(10);
            expect(code).toHaveLength(10);
        });
    });

    describe('validateRoomCode', () => {

        test('should accept valid 6-character uppercase code', () => {
            // valid codes
            expect(validateRoomCode('ABC123')).toBe(true);
            expect(validateRoomCode('XYZ789')).toBe(true);
        });

        test('should reject lowercase letters', () => {
            // invalid codes
            expect(validateRoomCode('abc123')).toBe(false);
        });

        test('should reject codes that are too short', () => {
            expect(validateRoomCode('ABC12')).toBe(false);
        });

        test('should reject codes that are too long', () => {
            expect(validateRoomCode('ABC1234')).toBe(false);
        });

        test('should reject codes with special characters', () => {
            expect(validateRoomCode('ABC-12')).toBe(false);
            expect(validateRoomCode('ABC@12')).toBe(false);
        });
    });

    describe('sanitizeInput', () => {

        test('should remove dangerous HTML characters', () => {
            // sanitize input
            const input = '<script>alert("xss")</script>';
            const result = sanitizeInput(input);
            expect(result).not.toContain('<');
            expect(result).not.toContain('>');
        });

        test('should remove quotes and ampersands', () => {
            const input = 'Hello "world" & \'test\'';
            const result = sanitizeInput(input);
            expect(result).not.toContain('"');
            expect(result).not.toContain('\'');
            expect(result).not.toContain('&');
        });

        test('should trim whitespace', () => {
            const input = '  hello world  ';
            const result = sanitizeInput(input);
            expect(result).toBe('hello world');
        });

        test('should return empty string for non-string input', () => {
            expect(sanitizeInput(123)).toBe('');
            expect(sanitizeInput(null)).toBe('');
            expect(sanitizeInput(undefined)).toBe('');
        });
    });

    describe('calculateVoteResult', () => {

        test('should count admit and deny votes correctly', () => {
            // vote data
            const votes = [
                { decision: 'admit' },
                { decision: 'admit' },
                { decision: 'deny' }
            ];
            const result = calculateVoteResult(votes);
            expect(result.admit).toBe(2);
            expect(result.deny).toBe(1);
            expect(result.total).toBe(3);
        });

        test('should return admit when more admit votes', () => {
            const votes = [
                { decision: 'admit' },
                { decision: 'admit' },
                { decision: 'deny' }
            ];
            const result = calculateVoteResult(votes);
            expect(result.result).toBe('admit');
        });

        test('should return deny when more deny votes', () => {
            const votes = [
                { decision: 'admit' },
                { decision: 'deny' },
                { decision: 'deny' }
            ];
            const result = calculateVoteResult(votes);
            expect(result.result).toBe('deny');
        });

        test('should handle empty votes array', () => {
            const votes = [];
            const result = calculateVoteResult(votes);
            expect(result.total).toBe(0);
            expect(result.hasResult).toBe(false);
        });
    });

    describe('validatePassword', () => {

        test('should accept valid alphanumeric password', async () => {
            // valid password
            const result = await validatePassword('password123');
            expect(result).toBe(true);
        });

        test('should accept password with special characters', async () => {
            const result = await validatePassword('pass@word!123');
            expect(result).toBe(true);
        });

        test('should reject empty password', async () => {
            const result = await validatePassword('');
            expect(result).toBe(false);
        });

        test('should trim whitespace before validation', async () => {
            const result = await validatePassword('  password123  ');
            expect(result).toBe(true);
        });
    });

    test('should reject password with only whitespace', async () => {
        const result = await validatePassword('   ');
        expect(result).toBe(false);
    });
});

describe('isRoomMember', () => {

    test('should return true when user is a member', () => {
        const room = {
            members: [
                { username: 'user1' },
                { username: 'user2' },
                { username: 'user3' }
            ]
        };
        expect(isRoomMember(room, 'user2')).toBe(true);
    });

    test('should return false when user is not a member', () => {
        const room = {
            members: [
                { username: 'user1' },
                { username: 'user2' }
            ]
        };
        expect(isRoomMember(room, 'user3')).toBe(false);
    });

    test('should return false for empty members array', () => {
        const room = {
            members: []
        };
        expect(isRoomMember(room, 'user1')).toBe(false);
    });

    test('should be case-sensitive', () => {
        const room = {
            members: [
                { username: 'User1' }
            ]
        };
        expect(isRoomMember(room, 'user1')).toBe(false);
        expect(isRoomMember(room, 'User1')).toBe(true);
    });
});

describe('Encryption Utilities Tests', () => {
    const encryptionManager = require('../utils/encryption');

    describe('generateRoomKey', () => {
        test('should generate a valid base64 key', () => {
            const key = encryptionManager.generateRoomKey();
            expect(key).toBeDefined();
            expect(typeof key).toBe('string');
            expect(key.length).toBeGreaterThan(40);
        });

        test('should generate different keys each time', () => {
            const key1 = encryptionManager.generateRoomKey();
            const key2 = encryptionManager.generateRoomKey();
            expect(key1).not.toBe(key2);
        });
    });

    describe('encryptMessage and decryptMessage', () => {
        test('should encrypt and decrypt message successfully', () => {
            const message = 'Hello, this is a secret message!';
            const roomKey = encryptionManager.generateRoomKey();

            const encrypted = encryptionManager.encryptMessage(message, roomKey);
            expect(encrypted.encrypted).toBeDefined();
            expect(encrypted.iv).toBeDefined();
            expect(encrypted.authTag).toBeDefined();

            const decrypted = encryptionManager.decryptMessage(encrypted, roomKey);
            expect(decrypted).toBe(message);
        });

        test('should handle special characters in message', () => {
            const message = 'Special chars: !@#$%^&*()_+{}[]|\\:";\'<>?,./';
            const roomKey = encryptionManager.generateRoomKey();

            const encrypted = encryptionManager.encryptMessage(message, roomKey);
            const decrypted = encryptionManager.decryptMessage(encrypted, roomKey);
            expect(decrypted).toBe(message);
        });

        test('should handle unicode characters', () => {
            const message = 'Unicode: 你好世界 🌍 مرحبا';
            const roomKey = encryptionManager.generateRoomKey();

            const encrypted = encryptionManager.encryptMessage(message, roomKey);
            const decrypted = encryptionManager.decryptMessage(encrypted, roomKey);
            expect(decrypted).toBe(message);
        });

        test('should fail decryption with wrong key', () => {
            const message = 'Secret message';
            const roomKey1 = encryptionManager.generateRoomKey();
            const roomKey2 = encryptionManager.generateRoomKey();

            const encrypted = encryptionManager.encryptMessage(message, roomKey1);

            expect(() => {
                encryptionManager.decryptMessage(encrypted, roomKey2);
            }).toThrow();
        });
    });

    describe('generateKeyPair', () => {
        test('should generate valid RSA key pair', () => {
            const { publicKey, privateKey } = encryptionManager.generateKeyPair();

            expect(publicKey).toBeDefined();
            expect(privateKey).toBeDefined();
            expect(publicKey).toContain('BEGIN PUBLIC KEY');
            expect(privateKey).toContain('BEGIN PRIVATE KEY');
        });
    });

    describe('encryptRoomKey and decryptRoomKey', () => {
        test('should encrypt and decrypt room key with RSA', () => {
            const roomKey = encryptionManager.generateRoomKey();
            const { publicKey, privateKey } = encryptionManager.generateKeyPair();

            const encryptedRoomKey = encryptionManager.encryptRoomKey(roomKey, publicKey);
            expect(encryptedRoomKey).toBeDefined();
            expect(typeof encryptedRoomKey).toBe('string');

            const decryptedRoomKey = encryptionManager.decryptRoomKey(encryptedRoomKey, privateKey);
            expect(decryptedRoomKey).toBe(roomKey);
        });
    });

    describe('hashData', () => {
        test('should generate consistent SHA-256 hash', () => {
            const data = 'test data';
            const hash1 = encryptionManager.hashData(data);
            const hash2 = encryptionManager.hashData(data);

            expect(hash1).toBe(hash2);
            expect(hash1.length).toBe(64);
        });

        test('should generate different hashes for different data', () => {
            const hash1 = encryptionManager.hashData('data1');
            const hash2 = encryptionManager.hashData('data2');

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('generateSecureRoomCode', () => {
        test('should generate room code with default length', () => {
            const code = encryptionManager.generateSecureRoomCode();
            expect(code).toHaveLength(8);
            expect(code).toMatch(/^[A-Z0-9]+$/);
        });

        test('should generate room code with custom length', () => {
            const code = encryptionManager.generateSecureRoomCode(12);
            expect(code).toHaveLength(12);
            expect(code).toMatch(/^[A-Z0-9]+$/);
        });

        test('should generate different codes each time', () => {
            const code1 = encryptionManager.generateSecureRoomCode();
            const code2 = encryptionManager.generateSecureRoomCode();
            expect(code1).not.toBe(code2);
        });
    });

    describe('rotateRoomKey', () => {
        test('should generate new room key on rotation', () => {
            const oldKey = encryptionManager.generateRoomKey();
            const newKey = encryptionManager.rotateRoomKey('ROOM123');

            expect(newKey).toBeDefined();
            expect(newKey).not.toBe(oldKey);
            expect(newKey.length).toBeGreaterThan(40);
        });
    });
});
