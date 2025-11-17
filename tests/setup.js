const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';
// Set JWT_SECRET for testing
process.env.JWT_SECRET = 'test-secret-key-for-jest-testing';
process.env.SESSION_SECRET = 'test-session-secret';

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  try {
    // Disconnect any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Close mongoose connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Stop the in-memory MongoDB server
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error);
  }
});

// Clear all collections before each test
beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});
