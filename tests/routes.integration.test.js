const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRouter = require('../routes/auth');
const User = require('../models/User');

let app;

beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-integration-testing';
    process.env.NODE_ENV = 'test';

    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use('/api/auth', authRouter);
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

describe('Auth Routes Integration Tests', () => {
    // registration endpoint
    describe('POST /api/auth/register', () => {

        test('should register a new user successfully', async () => {
            // test registration
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('registered successfully');
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.username).toBe('testuser');
            expect(response.body.user.email).toBe('test@example.com');
        });

        test('should reject registration with missing fields', async () => {
            // missing fields
            const response = await request(app)
                .post('/api/auth/register')
                .send({ username: 'testuser' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('provide');
        });

        test('should reject registration with short password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: '12345'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('6 characters');
        });

        test('should reject duplicate username', async () => {
            // duplicate check
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'different@example.com',
                    password: 'password456'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });

        test('should reject duplicate email', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'differentuser',
                    email: 'test@example.com',
                    password: 'password456'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });
    });

    describe('POST /api/auth/login', () => {

        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'loginuser',
                    email: 'login@example.com',
                    password: 'password123'
                });
        });

        test('should login with correct credentials', async () => {
            // login check
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'loginuser',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('successful');
            expect(response.body.token).toBeDefined();
            expect(response.body.user.username).toBe('loginuser');
        });

        test('should login with email instead of username', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'login@example.com',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('should reject login with wrong password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'loginuser',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid credentials');
        });

        test('should reject login for non-existent user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'nonexistent',
                    password: 'password123'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should reject login with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'loginuser' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/logout', () => {

        let authToken;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'logoutuser',
                    email: 'logout@example.com',
                    password: 'password123'
                });
            authToken = response.body.token;
        });

        test('should logout successfully with valid token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('successful');
        });

        test('should reject logout without token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should reject logout with invalid token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer invalid-token')
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/logout-all', () => {

        let authToken;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'logoutalluser',
                    email: 'logoutall@example.com',
                    password: 'password123'
                });
            authToken = response.body.token;

            await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'logoutalluser',
                    password: 'password123'
                });
        });

        test('should logout from all devices', async () => {
            // logout all
            const response = await request(app)
                .post('/api/auth/logout-all')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('all devices');

            const user = await User.findOne({ username: 'logoutalluser' });
            expect(user.activeSessions.length).toBe(0);
        });
    });

    describe('GET /api/auth/sessions', () => {

        let authToken;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'sessionuser',
                    email: 'session@example.com',
                    password: 'password123'
                });
            authToken = response.body.token;
        });

        test('should get active sessions', async () => {
            const response = await request(app)
                .get('/api/auth/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.sessions).toBeDefined();
            expect(Array.isArray(response.body.sessions)).toBe(true);
            expect(response.body.sessions.length).toBeGreaterThan(0);
        });

        test('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/auth/sessions')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/refresh', () => {

        let authToken;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'refreshuser',
                    email: 'refresh@example.com',
                    password: 'password123'
                });
            authToken = response.body.token;
        });

        test('should refresh token successfully', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.expiresAt).toBeDefined();

            const user = await User.findOne({ username: 'refreshuser' });
            expect(user.activeSessions.length).toBe(1);
            expect(user.activeSessions[0].token).toBe(response.body.token);
        });

        test('should reject refresh without token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
