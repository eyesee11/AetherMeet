const mongoose = require('mongoose');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');
const Note = require('../models/Note');

describe('User Model Tests', () => {
    // basic user creation
    test('should create a new user with valid data', async () => {
        const userData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        };

        const user = new User(userData);
        const savedUser = await user.save();

        expect(savedUser.username).toBe('testuser');
        expect(savedUser.email).toBe('test@example.com');
        expect(savedUser.password).not.toBe('password123');
    });

    // password security check
    test('should hash password before saving', async () => {
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'plaintext'
        });

        await user.save();

        expect(user.password).not.toBe('plaintext');
        expect(user.password.length).toBeGreaterThan(20);
    });

    test('should compare password correctly', async () => {
        // password check
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });

        await user.save();

        const isMatch = await user.comparePassword('password123');
        expect(isMatch).toBe(true);

        const isWrong = await user.comparePassword('wrongpassword');
        expect(isWrong).toBe(false);
    });

    test('should add session to user', async () => {
        // add session
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });

        await user.save();

        const token = 'test-token-123';
        const expiresAt = new Date(Date.now() + 3600000);

        await user.addSession(token, expiresAt, 'Test Device');

        expect(user.activeSessions.length).toBe(1);
        expect(user.activeSessions[0].token).toBe(token);
    });

    test('should remove session from user', async () => {
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });

        await user.save();

        const token = 'test-token-123';
        const expiresAt = new Date(Date.now() + 3600000);

        await user.addSession(token, expiresAt);
        await user.removeSession(token);

        expect(user.activeSessions.length).toBe(0);
    });

    test('should validate token correctly', async () => {
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });

        await user.save();

        const token = 'test-token-123';
        const expiresAt = new Date(Date.now() + 3600000);

        await user.addSession(token, expiresAt);

        expect(user.isTokenValid(token)).toBe(true);

        expect(user.isTokenValid('invalid-token')).toBe(false);
    });

    test('should update user preferences', async () => {
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });

        await user.save();

        user.preferences.language = 'es';
        user.preferences.theme = 'dark';
        await user.save();

        expect(user.preferences.language).toBe('es');
        expect(user.preferences.theme).toBe('dark');
    });

    test('should update analytics correctly', async () => {
        // update stats
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });

        await user.save();

        await user.updateAnalytics('room_created');
        await user.updateAnalytics('message_sent');

        expect(user.analytics.totalRoomsCreated).toBe(1);
        expect(user.analytics.totalMessagesSent).toBe(1);
    });

    test('should clean expired sessions', async () => {
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });

        await user.save();

        const expiredDate = new Date(Date.now() - 3600000);
        await user.addSession('expired-token', expiredDate);

        const validDate = new Date(Date.now() + 3600000);
        await user.addSession('valid-token', validDate);

        await user.cleanExpiredSessions();

        expect(user.activeSessions.length).toBe(1);
        expect(user.activeSessions[0].token).toBe('valid-token');
    });

    test('should calculate engagement score', async () => {
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });

        await user.save();

        await user.updateAnalytics('room_created');
        await user.updateAnalytics('message_sent');
        await user.updateAnalytics('message_sent');

        const score = user.calculateEngagementScore();

        expect(score).toBeGreaterThan(0);
        expect(typeof score).toBe('number');
    });

    test('should add moderation record', async () => {
        // add record
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });

        await user.save();

        await user.addModerationRecord('warned', 'Spam', 'ROOM01', 'moderator', 60);

        expect(user.moderationHistory.length).toBe(1);
        expect(user.moderationHistory[0].action).toBe('warned');
        expect(user.moderationHistory[0].reason).toBe('Spam');
        expect(user.moderationHistory[0].roomCode).toBe('ROOM01');
    });

    test('should suspend and unsuspend account', async () => {
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });

        await user.save();

        await user.suspendAccount('Violation of terms', 7);
        expect(user.accountStatus.isSuspended).toBe(true);
        expect(user.accountStatus.suspensionReason).toBe('Violation of terms');

        await user.unsuspendAccount();
        expect(user.accountStatus.isSuspended).toBe(false);
        expect(user.accountStatus.suspensionReason).toBeUndefined();
    });
});

describe('Room Model Tests', () => {
    // room setup
    test('should create a new room with valid data', async () => {
        const roomData = {
            roomCode: 'TEST01',
            name: 'Test Room',
            owner: 'testuser',
            primaryPassword: 'password123',
            description: 'A test room'
        };

        const room = new Room(roomData);
        const savedRoom = await room.save();

        expect(savedRoom.roomCode).toBe('TEST01');
        expect(savedRoom.name).toBe('Test Room');
        expect(savedRoom.owner).toBe('testuser');
    });

    test('should add member to room', async () => {
        // add member
        const room = new Room({
            roomCode: 'TEST01',
            name: 'Test Room',
            owner: 'owner',
            primaryPassword: 'password123'
        });

        await room.save();

        room.addMember('newuser');

        expect(room.members.length).toBe(1);
        expect(room.members[0].username).toBe('newuser');
    });

    test('should remove member from room', async () => {
        const room = new Room({
            roomCode: 'TEST01',
            name: 'Test Room',
            owner: 'owner',
            primaryPassword: 'password123'
        });

        await room.save();

        room.addMember('user1');
        room.removeMember('user1');

        expect(room.members.length).toBe(0);
    });

    test('should check if user is moderator', async () => {
        const room = new Room({
            roomCode: 'TEST01',
            name: 'Test Room',
            owner: 'owner',
            primaryPassword: 'password123',
            moderators: ['mod1', 'mod2']
        });

        await room.save();

        expect(room.isModerator('mod1')).toBe(true);
        expect(room.isModerator('notmod')).toBe(false);
    });

    test('should add moderator to room', async () => {
        const room = new Room({
            roomCode: 'TEST01',
            name: 'Test Room',
            owner: 'owner',
            primaryPassword: 'password123'
        });

        await room.save();

        room.addModerator('newmod');

        expect(room.moderators.includes('newmod')).toBe(true);
    });

    test('should update room settings', async () => {
        const room = new Room({
            roomCode: 'TEST01',
            name: 'Test Room',
            owner: 'owner',
            primaryPassword: 'password123'
        });

        await room.save();

        room.updateSettings({ maxMembers: 100 });

        expect(room.settings.maxMembers).toBe(100);
    });

    test('should update room analytics', async () => {
        const room = new Room({
            roomCode: 'TEST01',
            name: 'Test Room',
            owner: 'owner',
            primaryPassword: 'password123'
        });

        await room.save();

        room.updateAnalytics('message_sent');
        room.updateAnalytics('user_joined');

        expect(room.analytics.totalMessages).toBe(1);
        expect(room.analytics.totalJoins).toBe(1);
    });

    test('should transfer ownership', async () => {
        const room = new Room({
            roomCode: 'TEST01',
            name: 'Test Room',
            owner: 'owner',
            primaryPassword: 'password123'
        });

        await room.save();

        room.addMember('newowner');
        room.transferOwnership();

        expect(room.owner).toBe('newowner');
    });

    test('should calculate popularity score', async () => {
        const room = new Room({
            roomCode: 'TEST01',
            name: 'Test Room',
            owner: 'owner',
            primaryPassword: 'password123'
        });

        await room.save();

        room.updateAnalytics('message_sent');
        room.updateAnalytics('user_joined');

        const score = room.calculatePopularityScore();

        expect(score).toBeGreaterThanOrEqual(0);
        expect(typeof score).toBe('number');
    });

    test('should enable encryption', async () => {
        // enable encryption
        const room = new Room({
            roomCode: 'TEST01',
            name: 'Test Room',
            owner: 'owner',
            primaryPassword: 'password123'
        });

        await room.save();

        room.enableEncryption('test-room-key-123');

        expect(room.encryption.isEnabled).toBe(true);
        expect(room.encryption.roomKey).toBe('test-room-key-123');
    });

    test('should cleanup expired moderations', async () => {
        const room = new Room({
            roomCode: 'TEST01',
            name: 'Test Room',
            owner: 'owner',
            primaryPassword: 'password123'
        });

        await room.save();

        room.mutedUsers.push({
            username: 'expired',
            expiresAt: new Date(Date.now() - 3600000),
            isPermanent: false
        });

        room.mutedUsers.push({
            username: 'active',
            expiresAt: new Date(Date.now() + 3600000),
            isPermanent: false
        });

        await room.cleanupExpiredModerations();

        expect(room.mutedUsers.length).toBe(1);
        expect(room.mutedUsers[0].username).toBe('active');
    });
});

describe('Message Model Tests', () => {
    // message creation
    test('should create a new message', async () => {
        // create message
        const roomId = new mongoose.Types.ObjectId();

        const messageData = {
            roomId: roomId,
            username: 'testuser',
            content: 'Hello world',
            messageType: 'text'
        };

        const message = new Message(messageData);
        const savedMessage = await message.save();

        expect(savedMessage.roomId.toString()).toBe(roomId.toString());
        expect(savedMessage.username).toBe('testuser');
        expect(savedMessage.content).toBe('Hello world');
    });

    test('should create message with default type', async () => {
        const roomId = new mongoose.Types.ObjectId();

        const message = new Message({
            roomId: roomId,
            username: 'testuser',
            content: 'Test message'
        });

        await message.save();

        expect(message.messageType).toBe('text');
    });
});

describe('Note Model Tests', () => {

    test('should create a new note', async () => {
        // note data
        const noteData = {
            noteCode: 'NOTE01',
            title: 'Test Note',
            content: 'Note content',
            owner: 'testuser',
            primaryPassword: 'password123'
        };

        const note = new Note(noteData);
        const savedNote = await note.save();

        expect(savedNote.noteCode).toBe('NOTE01');
        expect(savedNote.title).toBe('Test Note');
        expect(savedNote.owner).toBe('testuser');
    });

    test('should have timestamps', async () => {
        const note = new Note({
            noteCode: 'NOTE02',
            title: 'Test Note',
            content: 'Content',
            owner: 'testuser',
            primaryPassword: 'password123'
        });

        await note.save();

        expect(note.createdAt).toBeDefined();
        expect(note.updatedAt).toBeDefined();
    });

    test('should generate unique note code', () => {
        const code = Note.generateNoteCode();

        expect(code).toBeDefined();
        expect(code.length).toBe(6);
        expect(code).toMatch(/^[A-Z0-9]+$/);
    });
});
