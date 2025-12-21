const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');

let app;

beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
    process.env.NODE_ENV = 'test';

    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get('/api/health', (req, res) => {
        res.json({
            status: 'OK',
            database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
            uptime: process.uptime(),
            version: '1.0.0',
            timestamp: new Date().toISOString()
        });
    });

    app.post('/api/auth/register', async (req, res) => {
        try {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
            }

            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }

            const user = new User({ username, email, password });
            await user.save();

            const token = jwt.sign(
                { userId: user._id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );

            const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

            await user.addSession(token, expiresAt, 'Test Device');

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                token,
                expiresAt,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });

    app.post('/api/auth/login', async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required'
                });
            }

            const user = await User.findOne({ username });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const token = jwt.sign(
                { userId: user._id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );

            const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
            await user.addSession(token, expiresAt, 'Test Device');

            res.json({
                success: true,
                message: 'Login successful',
                token,
                expiresAt,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });

    const authenticateToken = async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!user.isTokenValid(token)) {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired or invalid'
                });
            }

            req.user = decoded;
            req.token = token;
            next();
        } catch (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
    };

    app.post('/api/auth/logout', authenticateToken, async (req, res) => {
        try {
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            await user.removeSession(req.token);

            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });

    app.post('/api/auth/logout-all', authenticateToken, async (req, res) => {
        try {
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            await user.removeAllSessions();

            res.json({
                success: true,
                message: 'Logged out from all devices successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });

    app.get('/api/auth/sessions', authenticateToken, async (req, res) => {
        try {
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                sessions: user.activeSessions.map(session => ({
                    deviceInfo: session.deviceInfo,
                    createdAt: session.createdAt,
                    expiresAt: session.expiresAt
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });

    app.post('/api/auth/refresh', authenticateToken, async (req, res) => {
        try {
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            await user.removeSession(req.token);

            const newToken = jwt.sign(
                {
                    userId: user._id,
                    username: user.username,
                    refreshedAt: Date.now()
                },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );

            const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
            await user.addSession(newToken, expiresAt, 'Test Device');

            res.json({
                success: true,
                token: newToken,
                expiresAt
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });

    app.post('/api/rooms/create', authenticateToken, async (req, res) => {
        try {
            const { name, description, primaryPassword } = req.body;

            if (!name || !primaryPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and password are required'
                });
            }

            const roomCode = Room.generateRoomCode();
            const room = new Room({
                roomCode,
                name,
                description,
                owner: req.user.username,
                primaryPassword
            });

            await room.save();

            res.status(201).json({
                success: true,
                message: 'Room created successfully',
                room: {
                    roomCode: room.roomCode,
                    name: room.name,
                    description: room.description,
                    owner: room.owner
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

describe('API Routes - Comprehensive Tests', () => {
    // health check
    describe('Health Check Endpoint', () => {

        test('should return health status with 200', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body.status).toBe('OK');
            expect(response.body.database).toBe('Connected');
        });

        test('should include server uptime', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body.uptime).toBeDefined();
            expect(typeof response.body.uptime).toBe('number');
            expect(response.body.uptime).toBeGreaterThan(0);
        });

        test('should include API version', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body.version).toBeDefined();
            expect(response.body.version).toBe('1.0.0');
        });

        test('should include timestamp', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body.timestamp).toBeDefined();
        });
    });

    // user registration
    describe('Authentication Routes - Registration', () => {

        describe('POST /api/auth/register', () => {

            test('should register new user with valid data', async () => {
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
                expect(response.body.message).toBe('User registered successfully');
                expect(response.body.token).toBeDefined();
                expect(response.body.expiresAt).toBeDefined();
                expect(response.body.user).toBeDefined();
                expect(response.body.user.username).toBe('testuser');
                expect(response.body.user.email).toBe('test@example.com');
                expect(response.body.user.password).toBeUndefined();
            });

            test('should reject registration without username', async () => {
                const userData = {
                    email: 'test@example.com',
                    password: 'password123'
                };

                const response = await request(app)
                    .post('/api/auth/register')
                    .send(userData)
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('required');
            });

            test('should reject registration without email', async () => {
                const userData = {
                    username: 'testuser',
                    password: 'password123'
                };

                const response = await request(app)
                    .post('/api/auth/register')
                    .send(userData)
                    .expect(400);

                expect(response.body.success).toBe(false);
            });

            test('should reject registration without password', async () => {
                const userData = {
                    username: 'testuser',
                    email: 'test@example.com'
                };

                const response = await request(app)
                    .post('/api/auth/register')
                    .send(userData)
                    .expect(400);

                expect(response.body.success).toBe(false);
            });

            test('should reject duplicate username', async () => {
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

            test('should create user session on registration', async () => {
                const userData = {
                    username: 'sessionuser',
                    email: 'session@example.com',
                    password: 'password123'
                };

                const response = await request(app)
                    .post('/api/auth/register')
                    .send(userData)
                    .expect(201);

                const user = await User.findOne({ username: 'sessionuser' });
                expect(user.activeSessions.length).toBe(1);
                expect(user.activeSessions[0].token).toBe(response.body.token);
            });
        });
    });

    // login tests
    describe('Authentication Routes - Login', () => {

        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'loginuser',
                    email: 'login@example.com',
                    password: 'password123'
                });
        });

        describe('POST /api/auth/login', () => {

            test('should login with correct credentials', async () => {
                // test login
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        username: 'loginuser',
                        password: 'password123'
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe('Login successful');
                expect(response.body.token).toBeDefined();
                expect(response.body.expiresAt).toBeDefined();
                expect(response.body.user.username).toBe('loginuser');
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
                expect(response.body.message).toContain('Invalid');
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

            test('should reject login without username', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        password: 'password123'
                    })
                    .expect(400);

                expect(response.body.success).toBe(false);
            });

            test('should reject login without password', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        username: 'loginuser'
                    })
                    .expect(400);

                expect(response.body.success).toBe(false);
            });

            test('should create new session on login', async () => {
                await request(app)
                    .post('/api/auth/login')
                    .send({
                        username: 'loginuser',
                        password: 'password123'
                    })
                    .expect(200);

                const user = await User.findOne({ username: 'loginuser' });
                expect(user.activeSessions.length).toBe(2);
            });
        });
    });

    describe('Authentication Routes - Logout', () => {

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

        describe('POST /api/auth/logout', () => {

            test('should logout with valid token', async () => {
                // logout test
                const response = await request(app)
                    .post('/api/auth/logout')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Logged out');
            });

            test('should reject logout without token', async () => {
                const response = await request(app)
                    .post('/api/auth/logout')
                    .expect(401);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('token required');
            });

            test('should remove session from user on logout', async () => {
                await request(app)
                    .post('/api/auth/logout')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                const user = await User.findOne({ username: 'logoutuser' });
                expect(user.activeSessions.length).toBe(0);
            });
        });

        describe('POST /api/auth/logout-all', () => {

            test('should logout from all devices', async () => {
                await request(app)
                    .post('/api/auth/login')
                    .send({
                        username: 'logoutuser',
                        password: 'password123'
                    });

                const response = await request(app)
                    .post('/api/auth/logout-all')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('all devices');

                const user = await User.findOne({ username: 'logoutuser' });
                expect(user.activeSessions.length).toBe(0);
            });
        });
    });

    describe('Protected Routes - Sessions', () => {

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

        describe('GET /api/auth/sessions', () => {

            test('should get active sessions with valid token', async () => {
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

            test('should reject request with invalid token', async () => {
                const response = await request(app)
                    .get('/api/auth/sessions')
                    .set('Authorization', 'Bearer invalid-token')
                    .expect(403);

                expect(response.body.success).toBe(false);
            });
        });
    });

    describe('Token Refresh', () => {

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

        describe('POST /api/auth/refresh', () => {

            test('should refresh token with valid token', async () => {
                // refresh token
                const response = await request(app)
                    .post('/api/auth/refresh')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.token).toBeDefined();
                expect(response.body.token).not.toBe(authToken);
                expect(response.body.expiresAt).toBeDefined();
            });

            test('should reject refresh without token', async () => {
                const response = await request(app)
                    .post('/api/auth/refresh')
                    .expect(401);

                expect(response.body.success).toBe(false);
            });
        });
    });

    describe('Room Routes', () => {

        let authToken;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'roomuser',
                    email: 'room@example.com',
                    password: 'password123'
                });
            authToken = response.body.token;
        });

        describe('POST /api/rooms/create', () => {

            test('should create room with valid data', async () => {
                // create room
                const response = await request(app)
                    .post('/api/rooms/create')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        name: 'Test Room',
                        description: 'A test room',
                        primaryPassword: 'roompass123'
                    })
                    .expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe('Room created successfully');
                expect(response.body.room).toBeDefined();
                expect(response.body.room.roomCode).toBeDefined();
                expect(response.body.room.name).toBe('Test Room');
            });

            test('should reject room creation without authentication', async () => {
                const response = await request(app)
                    .post('/api/rooms/create')
                    .send({
                        name: 'Test Room',
                        primaryPassword: 'roompass123'
                    })
                    .expect(401);

                expect(response.body.success).toBe(false);
            });

            test('should reject room creation without required fields', async () => {
                const response = await request(app)
                    .post('/api/rooms/create')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        description: 'A test room'
                    })
                    .expect(400);

                expect(response.body.success).toBe(false);
            });
        });
    });
});
