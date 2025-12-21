const encryptionManager = require('../utils/encryption');

describe('Encryption Utilities Tests', () => {
    // key generation
    describe('Room Key Generation', () => {

        test('should generate a room key', () => {
            // generate key
            const roomKey = encryptionManager.generateRoomKey();

            expect(roomKey).toBeDefined();
            expect(typeof roomKey).toBe('string');
            expect(roomKey.length).toBeGreaterThan(0);
        });

        test('should generate different keys each time', () => {
            const key1 = encryptionManager.generateRoomKey();
            const key2 = encryptionManager.generateRoomKey();

            expect(key1).not.toBe(key2);
        });
    });

    // encryption/decryption tests
    describe('Message Encryption and Decryption', () => {

        test('should encrypt a message', () => {
            // encrypt test
            const message = 'Hello, this is a secret message';
            const roomKey = encryptionManager.generateRoomKey();

            const encrypted = encryptionManager.encryptMessage(message, roomKey);

            expect(encrypted.encrypted).toBeDefined();
            expect(encrypted.iv).toBeDefined();
            expect(encrypted.authTag).toBeDefined();
            expect(encrypted.algorithm).toBe('aes-256-gcm');
        });

        test('should decrypt a message correctly', () => {
            // decrypt test
            const originalMessage = 'Secret message';
            const roomKey = encryptionManager.generateRoomKey();

            const encrypted = encryptionManager.encryptMessage(originalMessage, roomKey);
            const decrypted = encryptionManager.decryptMessage(encrypted, roomKey);

            expect(decrypted).toBe(originalMessage);
        });

        test('should fail to decrypt with wrong key', () => {
            // wrong key
            const message = 'Secret message';
            const roomKey1 = encryptionManager.generateRoomKey();
            const roomKey2 = encryptionManager.generateRoomKey();

            const encrypted = encryptionManager.encryptMessage(message, roomKey1);

            expect(() => {
                encryptionManager.decryptMessage(encrypted, roomKey2);
            }).toThrow();
        });

        test('should handle empty messages', () => {
            const message = '';
            const roomKey = encryptionManager.generateRoomKey();

            const encrypted = encryptionManager.encryptMessage(message, roomKey);
            const decrypted = encryptionManager.decryptMessage(encrypted, roomKey);

            expect(decrypted).toBe('');
        });
    });

    describe('Key Pair Generation', () => {

        test('should generate RSA key pair', () => {
            // generate keys
            const keyPair = encryptionManager.generateKeyPair();

            expect(keyPair.publicKey).toBeDefined();
            expect(keyPair.privateKey).toBeDefined();
            expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
            expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY');
        });
    });

    describe('Room Key Encryption with Public Key', () => {

        test('should encrypt room key with public key', () => {
            const roomKey = encryptionManager.generateRoomKey();
            const keyPair = encryptionManager.generateKeyPair();

            const encryptedRoomKey = encryptionManager.encryptRoomKey(roomKey, keyPair.publicKey);

            expect(encryptedRoomKey).toBeDefined();
            expect(typeof encryptedRoomKey).toBe('string');
        });

        test('should decrypt room key with private key', () => {
            const roomKey = encryptionManager.generateRoomKey();
            const keyPair = encryptionManager.generateKeyPair();

            const encryptedRoomKey = encryptionManager.encryptRoomKey(roomKey, keyPair.publicKey);
            const decryptedRoomKey = encryptionManager.decryptRoomKey(encryptedRoomKey, keyPair.privateKey);

            expect(decryptedRoomKey).toBe(roomKey);
        });
    });

    describe('Data Hashing', () => {

        test('should hash data with SHA-256', () => {
            // hash data
            const data = 'sensitive data';
            const hash = encryptionManager.hashData(data);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64);
        });

        test('should produce same hash for same data', () => {
            const data = 'test data';
            const hash1 = encryptionManager.hashData(data);
            const hash2 = encryptionManager.hashData(data);

            expect(hash1).toBe(hash2);
        });

        test('should produce different hash for different data', () => {
            const hash1 = encryptionManager.hashData('data1');
            const hash2 = encryptionManager.hashData('data2');

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('Secure Room Code Generation', () => {

        test('should generate secure room code', () => {
            const code = encryptionManager.generateSecureRoomCode();

            expect(code).toBeDefined();
            expect(code.length).toBe(8);
            expect(code).toMatch(/^[A-Z0-9]+$/);
        });

        test('should generate code with custom length', () => {
            const code = encryptionManager.generateSecureRoomCode(12);

            expect(code.length).toBe(12);
        });

        test('should generate different codes each time', () => {
            const code1 = encryptionManager.generateSecureRoomCode();
            const code2 = encryptionManager.generateSecureRoomCode();

            expect(code1).not.toBe(code2);
        });
    });

    describe('Room Key Rotation', () => {

        test('should rotate room key', () => {
            const roomCode = 'TEST01';
            const newKey = encryptionManager.rotateRoomKey(roomCode);

            expect(newKey).toBeDefined();
            expect(typeof newKey).toBe('string');
        });
    });
});
