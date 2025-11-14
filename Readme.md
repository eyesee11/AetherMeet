# AetherMeet - Secure & Ephemeral Team Chat Rooms

**A modern, secure chat application for temporary team collaboration with real-time messaging, media sharing, and advanced moderation features.**

---

## 📋 Overview

AetherMeet is a full-stack web application designed for secure, temporary team collaboration. Built with Node.js, Express, MongoDB, and Socket.IO, it offers real-time communication with end-to-end encryption capabilities.

**Key Features:**
- Instant demo rooms (no registration required)
- Secure authenticated rooms with JWT
- Real-time messaging with Socket.IO
- Media file sharing
- Advanced moderation and voting systems
- PDF chat export
- Dark/light theme support

---

## 🛠️ Tech Stack

**Backend:** Node.js, Express.js, MongoDB, Mongoose, Socket.IO, JWT, bcrypt  
**Frontend:** EJS, Tailwind CSS, Vanilla JavaScript  
**Security:** Helmet.js, Express Rate Limit, Input Sanitization  
**Testing:** Jest, Supertest, MongoDB Memory Server

---

## 📦 Installation

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB (local or cloud)

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/aethermeet.git
   cd aethermeet
   npm install
   ```

2. **Configure environment**
   
   Create `.env` file:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/aethermeet
   JWT_SECRET=your_secret_key_here
   SESSION_SECRET=your_session_secret_here
   ```

3. **Run the application**
   ```bash
   npm start
   ```
   
   Development mode:
   ```bash
   npm run dev
   ```

4. **Access at:** `http://localhost:5000`

---

## 🧪 Testing

Complete Jest testing suite with 50+ tests covering unit tests, integration tests, and API tests.

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:api          # API tests only

# Watch mode
npm run test:watch
```

### Test Structure

```
tests/
├── setup.js                 # Test environment setup
├── helpers.js               # Test utilities
├── unitTests.test.js        # 20+ unit tests
├── integrationTests.test.js # 15+ integration tests
└── apiTests.test.js         # 15+ API tests
```

### Test Coverage

- ✅ **Unit Tests** - Helper functions, validation, utilities
- ✅ **Integration Tests** - User/Room models, database operations
- ✅ **API Tests** - Authentication, room management, health checks

**Expected Coverage:** 85%+ statements, 75%+ branches

---

## 🚀 Usage

### Quick Demo (No Registration)

1. Go to `http://localhost:5000`
2. Click **"Try Demo"**
3. Share the room link
4. Start chatting

### Full Platform

1. **Register** - Create account
2. **Create Room** - Set name, password, admission type
3. **Join Room** - Enter room code and password
4. **Chat** - Send messages and share media

---

## 📚 API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout | Yes |
| POST | `/api/auth/refresh` | Refresh token | Yes |
| GET | `/api/auth/sessions` | Get sessions | Yes |

### Rooms

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/rooms/create-demo` | Create demo room | No |
| POST | `/api/rooms/instant` | Create instant room | Yes |
| POST | `/api/rooms/schedule` | Schedule room | Yes |
| POST | `/api/rooms/:code/join` | Join room | Yes |
| GET | `/api/rooms/:code/export` | Export PDF | Yes |

### System

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | No |

---

## 📁 Project Structure

```
aethermeet/
├── tests/                   # Jest test suite
│   ├── setup.js            # Test setup
│   ├── helpers.js          # Test utilities
│   ├── unitTests.test.js   # Unit tests
│   ├── integrationTests.test.js  # Integration tests
│   └── apiTests.test.js    # API tests
├── models/                  # Database models
│   ├── User.js
│   ├── Room.js
│   ├── Message.js
│   └── ...
├── routes/                  # API routes
│   ├── auth.js
│   ├── rooms.js
│   └── ...
├── utils/                   # Utilities
│   └── helpers.js
├── views/                   # EJS templates
├── public/                  # Static files
├── jest.config.js          # Jest configuration
├── server.js               # Main server
└── package.json            # Dependencies
```

---

## 🎯 Features

### Room Management
- Instant demo rooms
- Authenticated rooms
- Scheduled rooms
- Flexible passwords
- Owner approval
- Democratic voting

### Communication
- Real-time messaging
- Media sharing
- Message history
- PDF export

### Security
- JWT authentication
- Password hashing
- Rate limiting
- Input sanitization
- Session management

---

## 📄 License

ISC License

---

## 👨‍💻 Author

**B.Tech Final Year Project**

---

**Ready for Demonstration! 🚀**
