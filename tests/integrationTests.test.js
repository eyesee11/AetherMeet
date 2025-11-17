const User = require('../models/User');
const Room = require('../models/Room');
const { createTestUser, createTestRoomData } = require('./helpers');

describe('Integration Tests - Model Interactions', () => {

  // Test User model operations
  describe('User Model', () => {

    test('should create a new user successfully', async () => {
      const user = await createTestUser({
        username: 'john',
        email: 'john@example.com',
        password: 'secure123'
      });

      expect(user.username).toBe('john');
      expect(user.email).toBe('john@example.com');
      expect(user.password).not.toBe('secure123'); // Password should be hashed
    });

    test('should hash password before saving', async () => {
      const plainPassword = 'mypassword123';
      const user = await createTestUser({ password: plainPassword });
      
      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[ab]\$/); // bcrypt hash prefix ($2a$ or $2b$)
    });

    test('should validate password correctly', async () => {
      const user = await createTestUser({ password: 'testpass123' });
      
      const isValid = await user.comparePassword('testpass123');
      const isInvalid = await user.comparePassword('wrongpassword');
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    test('should prevent duplicate username', async () => {
      await createTestUser({ username: 'duplicate' });
      
      await expect(
        createTestUser({ username: 'duplicate', email: 'different@example.com' })
      ).rejects.toThrow();
    });

    test('should prevent duplicate email', async () => {
      await createTestUser({ email: 'same@example.com' });
      
      await expect(
        createTestUser({ username: 'different', email: 'same@example.com' })
      ).rejects.toThrow();
    });

    test('should add active session to user', async () => {
      const user = await createTestUser();
      const token = 'test-token-123';
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      await user.addSession(token, expiresAt, 'Chrome Browser');
      
      expect(user.activeSessions).toHaveLength(1);
      expect(user.activeSessions[0].token).toBe(token);
      expect(user.activeSessions[0].deviceInfo).toBe('Chrome Browser');
    });

    test('should remove session from user', async () => {
      const user = await createTestUser();
      const token = 'test-token-456';
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      await user.addSession(token, expiresAt);
      await user.removeSession(token);
      
      expect(user.activeSessions).toHaveLength(0);
    });

    test('should validate active token', async () => {
      const user = await createTestUser();
      const token = 'valid-token';
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      await user.addSession(token, expiresAt);
      
      expect(user.isTokenValid(token)).toBe(true);
      expect(user.isTokenValid('invalid-token')).toBe(false);
    });

    test('should clean expired sessions', async () => {
      const user = await createTestUser();
      const expiredDate = new Date(Date.now() - 1000);
      const validDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      user.activeSessions = [
        { token: 'expired-token', expiresAt: expiredDate, deviceInfo: 'Device1' },
        { token: 'valid-token', expiresAt: validDate, deviceInfo: 'Device2' }
      ];
      
      await user.cleanExpiredSessions();
      
      expect(user.activeSessions).toHaveLength(1);
      expect(user.activeSessions[0].token).toBe('valid-token');
    });
  });

  // Test Room model operations
  describe('Room Model', () => {

    test('should create a new room successfully', async () => {
      const roomData = createTestRoomData();
      const room = new Room(roomData);
      await room.save();

      expect(room.roomCode).toBe('TEST01');
      expect(room.name).toBe('Test Room');
      expect(room.owner).toBe('testuser');
      expect(room.isActive).toBe(true);
    });

    test('should generate unique room codes', () => {
      const code1 = Room.generateRoomCode();
      const code2 = Room.generateRoomCode();
      
      expect(code1).toHaveLength(6);
      expect(code2).toHaveLength(6);
      expect(code1).not.toBe(code2);
    });

    test('should add member to room', async () => {
      const roomData = createTestRoomData();
      const room = new Room(roomData);
      
      room.addMember('newuser');
      
      expect(room.members).toHaveLength(1);
      expect(room.members[0].username).toBe('newuser');
    });

    test('should not add duplicate members', async () => {
      const roomData = createTestRoomData();
      const room = new Room(roomData);
      
      room.addMember('user1');
      room.addMember('user1');
      
      expect(room.members).toHaveLength(1);
    });

    test('should remove member from room', async () => {
      const roomData = createTestRoomData();
      const room = new Room(roomData);
      
      room.addMember('user1');
      room.addMember('user2');
      room.removeMember('user1');
      
      expect(room.members).toHaveLength(1);
      expect(room.members[0].username).toBe('user2');
    });

    test('should transfer ownership to next member', async () => {
      const roomData = createTestRoomData({ owner: 'oldowner' });
      const room = new Room(roomData);
      
      room.addMember('member1');
      room.addMember('member2');
      
      const newOwner = room.transferOwnership();
      
      expect(newOwner).toBe('member1');
      expect(room.owner).toBe('member1');
    });

    test('should create demo room with expiry', async () => {
      const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const roomData = createTestRoomData({
        isDemoRoom: true,
        expiresAt: expiryDate
      });
      const room = new Room(roomData);
      await room.save();

      expect(room.isDemoRoom).toBe(true);
      expect(room.expiresAt).toBeDefined();
    });

    test('should update room analytics for messages', async () => {
      const roomData = createTestRoomData();
      const room = new Room(roomData);
      
      room.updateAnalytics('message_sent');
      room.updateAnalytics('message_sent');
      
      expect(room.analytics.totalMessages).toBe(2);
    });

    test('should update room analytics for media', async () => {
      const roomData = createTestRoomData();
      const room = new Room(roomData);
      
      room.updateAnalytics('media_shared');
      
      expect(room.analytics.totalMediaFiles).toBe(1);
    });

    test('should track peak concurrent users', async () => {
      const roomData = createTestRoomData();
      const room = new Room(roomData);
      
      room.addMember('user1');
      room.addMember('user2');
      room.addMember('user3');
      room.updateAnalytics('user_joined');
      
      expect(room.analytics.peakConcurrentUsers).toBe(3);
    });
  });

  // Test User and Room interaction
  describe('User and Room Interaction', () => {

    test('should link user to room as member', async () => {
      const user = await createTestUser({ username: 'alice' });
      const roomData = createTestRoomData({ owner: 'bob' });
      const room = new Room(roomData);
      
      room.addMember(user.username);
      await room.save();
      
      const savedRoom = await Room.findOne({ roomCode: 'TEST01' });
      expect(savedRoom.members.some(m => m.username === 'alice')).toBe(true);
    });

    test('should update user analytics when creating room', async () => {
      const user = await createTestUser();
      
      await user.updateAnalytics('room_created');
      
      expect(user.analytics.totalRoomsCreated).toBe(1);
    });

    test('should update user analytics when joining room', async () => {
      const user = await createTestUser();
      
      await user.updateAnalytics('room_joined');
      
      expect(user.analytics.totalRoomsJoined).toBe(1);
    });
  });
});
