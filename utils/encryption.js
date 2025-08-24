const crypto = require('crypto');

/**
 * Advanced Encryption Utilities for End-to-End Message Security
 * Implements AES-256-GCM for message encryption with key rotation support
 */

class EncryptionManager {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 16;  // 128 bits
        this.tagLength = 16; // 128 bits
    }

    /**
     * Generate a new encryption key for a room
     * @returns {string} Base64 encoded encryption key
     */
    generateRoomKey() {
        return crypto.randomBytes(this.keyLength).toString('base64');
    }

    /**
     * Generate initialization vector
     * @returns {Buffer} Random IV
     */
    generateIV() {
        return crypto.randomBytes(this.ivLength);
    }

    /**
     * Encrypt a message using room-specific key
     * @param {string} message - The message to encrypt
     * @param {string} roomKey - Base64 encoded room encryption key
     * @returns {object} Encrypted data with IV and auth tag
     */
    encryptMessage(message, roomKey) {
        try {
            const key = Buffer.from(roomKey, 'base64');
            const iv = this.generateIV();
            const cipher = crypto.createCipher(this.algorithm, key);
            cipher.setAAD(Buffer.from('aethermeet-message'));

            let encrypted = cipher.update(message, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();

            return {
                encrypted,
                iv: iv.toString('base64'),
                authTag: authTag.toString('base64'),
                algorithm: this.algorithm
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt message');
        }
    }

    /**
     * Decrypt a message using room-specific key
     * @param {object} encryptedData - The encrypted message data
     * @param {string} roomKey - Base64 encoded room encryption key
     * @returns {string} Decrypted message
     */
    decryptMessage(encryptedData, roomKey) {
        try {
            const key = Buffer.from(roomKey, 'base64');
            const iv = Buffer.from(encryptedData.iv, 'base64');
            const authTag = Buffer.from(encryptedData.authTag, 'base64');
            
            const decipher = crypto.createDecipher(this.algorithm, key);
            decipher.setAAD(Buffer.from('aethermeet-message'));
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt message');
        }
    }

    /**
     * Generate key pair for asymmetric encryption (user-specific)
     * @returns {object} Public and private key pair
     */
    generateKeyPair() {
        try {
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });

            return { publicKey, privateKey };
        } catch (error) {
            console.error('Key pair generation error:', error);
            throw new Error('Failed to generate key pair');
        }
    }

    /**
     * Encrypt room key with user's public key
     * @param {string} roomKey - The room encryption key
     * @param {string} publicKey - User's public key
     * @returns {string} Encrypted room key
     */
    encryptRoomKey(roomKey, publicKey) {
        try {
            const buffer = Buffer.from(roomKey, 'base64');
            const encrypted = crypto.publicEncrypt(publicKey, buffer);
            return encrypted.toString('base64');
        } catch (error) {
            console.error('Room key encryption error:', error);
            throw new Error('Failed to encrypt room key');
        }
    }

    /**
     * Decrypt room key with user's private key
     * @param {string} encryptedRoomKey - Encrypted room key
     * @param {string} privateKey - User's private key
     * @returns {string} Decrypted room key
     */
    decryptRoomKey(encryptedRoomKey, privateKey) {
        try {
            const buffer = Buffer.from(encryptedRoomKey, 'base64');
            const decrypted = crypto.privateDecrypt(privateKey, buffer);
            return decrypted.toString('base64');
        } catch (error) {
            console.error('Room key decryption error:', error);
            throw new Error('Failed to decrypt room key');
        }
    }

    /**
     * Rotate room encryption key for enhanced security
     * @param {string} roomCode - Room identifier
     * @returns {string} New room encryption key
     */
    rotateRoomKey(roomCode) {
        const newKey = this.generateRoomKey();
        console.log(`Room key rotated for room: ${roomCode}`);
        return newKey;
    }

    /**
     * Hash sensitive data for storage
     * @param {string} data - Data to hash
     * @returns {string} SHA-256 hash
     */
    hashData(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Generate secure room codes with entropy
     * @param {number} length - Length of room code
     * @returns {string} Secure room code
     */
    generateSecureRoomCode(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, chars.length);
            result += chars[randomIndex];
        }
        
        return result;
    }
}

module.exports = new EncryptionManager();
