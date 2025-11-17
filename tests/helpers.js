const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Create test user helper
const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  };

  const userData = { ...defaultUser, ...overrides };
  const user = new User(userData);
  await user.save();
  return user;
};

// Generate test JWT token
const generateTestToken = (userId, username) => {
  return jwt.sign(
    { userId, username },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '2h' }
  );
};

// Create test room data
const createTestRoomData = (overrides = {}) => {
  const defaultRoom = {
    roomCode: 'TEST01',
    name: 'Test Room',
    owner: 'testuser',
    primaryPassword: 'password123',
    admissionType: 'owner_approval',
    isDemoRoom: false
  };

  return { ...defaultRoom, ...overrides };
};

module.exports = {
  createTestUser,
  generateTestToken,
  createTestRoomData
};
