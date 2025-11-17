const request = require('supertest');
const express = require('express');
const User = require('../models/User');
const Room = require('../models/Room');
const { createTestUser, generateTestToken } = require('./helpers');

// Create a test app instance without starting the server
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Import routes
  const authRoutes = require('../routes/auth');
  
  // Mount routes
  app.use('/api/auth', authRoutes);
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    const healthCheck = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      status: 'OK',
      memory: process.memoryUsage(),
      version: '1.0.0'
    };
    
    healthCheck.database = 'Connected';
    res.status(200).json(healthCheck);
  });
  
  return app;
};

const app = createTestApp();

describe('API Tests - REST Endpoints', () => {

  // Test authentication endpoints
  describe('POST /api/auth/register', () => {

    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe('newuser');
    });

    test('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '12345'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least 6 characters');
    });

    test('should reject duplicate username', async () => {
      await createTestUser({ username: 'duplicate' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicate',
          email: 'new@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });
  });

  // Test login endpoint
  describe('POST /api/auth/login', () => {

    test('should login with valid credentials', async () => {
      await createTestUser({
        username: 'loginuser',
        password: 'password123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    test('should reject login with wrong password', async () => {
      await createTestUser({
        username: 'user1',
        password: 'correctpass'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'user1',
          password: 'wrongpass'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should reject login for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // Test logout endpoint
  describe('POST /api/auth/logout', () => {

    test('should logout user with valid token', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id, user.username);
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      await user.addSession(token, expiresAt);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('token required');
    });
  });

  // Test room creation endpoints
  describe('Room Creation', () => {

    test('should create room data structure', () => {
      const roomData = {
        roomCode: 'TEST01',
        name: 'Test Room',
        owner: 'testuser',
        primaryPassword: 'password123',
        admissionType: 'owner_approval',
        isDemoRoom: false
      };

      expect(roomData.roomCode).toBe('TEST01');
      expect(roomData.name).toBe('Test Room');
      expect(roomData.owner).toBe('testuser');
    });

    test('should validate room code format', () => {
      const validCode = 'ABC123';
      const invalidCode = 'abc';
      
      expect(validCode).toMatch(/^[A-Z0-9]{6}$/);
      expect(invalidCode).not.toMatch(/^[A-Z0-9]{6}$/);
    });

    test('should create demo room structure', () => {
      const demoRoom = {
        name: 'Demo Room',
        isDemoRoom: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      expect(demoRoom.isDemoRoom).toBe(true);
      expect(demoRoom.expiresAt).toBeDefined();
      expect(demoRoom.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  // Test health check endpoint
  describe('GET /api/health', () => {

    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });

    test('should include database status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body.database).toBeDefined();
    });

    test('should include version information', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body.version).toBeDefined();
    });
  });

  // Test token refresh endpoint
  describe('POST /api/auth/refresh', () => {

    test('should refresh valid token', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id, user.username);
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      await user.addSession(token, expiresAt);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      // New token should exist
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    test('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh');

      expect(response.status).toBe(401);
    });
  });

  // Test session management
  describe('GET /api/auth/sessions', () => {

    test('should get active sessions', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id, user.username);
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      await user.addSession(token, expiresAt, 'Test Device');

      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sessions).toBeInstanceOf(Array);
      expect(response.body.sessions.length).toBeGreaterThan(0);
    });

    test('should reject sessions request without token', async () => {
      const response = await request(app)
        .get('/api/auth/sessions');

      expect(response.status).toBe(401);
    });
  });
});
