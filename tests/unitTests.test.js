const {
  validatePassword,
  generateSecureCode,
  validateRoomCode,
  sanitizeInput,
  calculateVoteResult
} = require('../utils/helpers');

describe('Unit Tests - Helper Functions', () => {
  
  // Test password validation function
  describe('validatePassword', () => {
    
    test('should accept valid alphanumeric password', async () => {
      const result = await validatePassword('password123');
      expect(result).toBe(true);
    });

    test('should accept password with special characters', async () => {
      const result = await validatePassword('pass@123!');
      expect(result).toBe(true);
    });

    test('should reject empty password', async () => {
      const result = await validatePassword('');
      expect(result).toBe(false);
    });

    test('should reject whitespace-only password', async () => {
      const result = await validatePassword('   ');
      expect(result).toBe(false);
    });

    test('should accept short passwords', async () => {
      const result = await validatePassword('abc');
      expect(result).toBe(true);
    });
  });

  // Test secure code generation
  describe('generateSecureCode', () => {
    
    test('should generate code with default length of 6', () => {
      const code = generateSecureCode();
      expect(code).toHaveLength(6);
    });

    test('should generate code with custom length', () => {
      const code = generateSecureCode(10);
      expect(code).toHaveLength(10);
    });

    test('should generate uppercase alphanumeric code', () => {
      const code = generateSecureCode();
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    test('should generate unique codes', () => {
      const code1 = generateSecureCode();
      const code2 = generateSecureCode();
      expect(code1).not.toBe(code2);
    });
  });

  // Test room code validation
  describe('validateRoomCode', () => {
    
    test('should accept valid 6-character uppercase code', () => {
      const result = validateRoomCode('ABC123');
      expect(result).toBe(true);
    });

    test('should reject lowercase room code', () => {
      const result = validateRoomCode('abc123');
      expect(result).toBe(false);
    });

    test('should reject code with less than 6 characters', () => {
      const result = validateRoomCode('ABC12');
      expect(result).toBe(false);
    });

    test('should reject code with more than 6 characters', () => {
      const result = validateRoomCode('ABC1234');
      expect(result).toBe(false);
    });

    test('should reject code with special characters', () => {
      const result = validateRoomCode('ABC@12');
      expect(result).toBe(false);
    });
  });

  // Test input sanitization
  describe('sanitizeInput', () => {
    
    test('should remove HTML tags', () => {
      const result = sanitizeInput('<script>alert("xss")</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    test('should trim whitespace', () => {
      const result = sanitizeInput('  hello world  ');
      expect(result).toBe('hello world');
    });

    test('should handle empty string', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    test('should handle non-string input', () => {
      const result = sanitizeInput(123);
      expect(result).toBe('');
    });

    test('should remove dangerous characters', () => {
      const result = sanitizeInput('hello"world&test');
      expect(result).not.toContain('"');
      expect(result).not.toContain('&');
    });
  });

  // Test voting calculation
  describe('calculateVoteResult', () => {
    
    test('should calculate majority admit votes', () => {
      const votes = [
        { voter: 'user1', decision: 'admit' },
        { voter: 'user2', decision: 'admit' },
        { voter: 'user3', decision: 'deny' }
      ];
      const result = calculateVoteResult(votes);
      expect(result.result).toBe('admit');
      expect(result.admit).toBe(2);
      expect(result.deny).toBe(1);
    });

    test('should calculate majority deny votes', () => {
      const votes = [
        { voter: 'user1', decision: 'deny' },
        { voter: 'user2', decision: 'deny' },
        { voter: 'user3', decision: 'admit' }
      ];
      const result = calculateVoteResult(votes);
      expect(result.result).toBe('deny');
      expect(result.deny).toBe(2);
      expect(result.admit).toBe(1);
    });

    test('should handle empty votes array', () => {
      const result = calculateVoteResult([]);
      expect(result.total).toBe(0);
      expect(result.hasResult).toBe(false);
    });

    test('should handle tie votes as deny', () => {
      const votes = [
        { voter: 'user1', decision: 'admit' },
        { voter: 'user2', decision: 'deny' }
      ];
      const result = calculateVoteResult(votes);
      expect(result.result).toBe('deny');
    });
  });
});
