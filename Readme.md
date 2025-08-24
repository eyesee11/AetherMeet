# AetherMeet - Secure & Ephemeral Team Chat Rooms

AetherMeet is a smart, secure messaging application designed for creating temporary, highly-controlled chat rooms. Featuring both authenticated rooms and instant demo rooms, it provides robust features for creating instan* **Memory Management**: Reduced memory usage with separated message storage
* **Connection Pooling**: Optimized MongoDB connection management

## 🔄 Development Roadmap

### ✅ Phase 1: Foundation & Security (COMPLETED)
**Status: COMPLETED ✅**

All Phase 1 security and performance improvements have been successfully implemented and tested:

#### Security Hardening ✅
- [x] **Rate Limiting Implementation**: Advanced multi-layer rate limiting deployed
  - General API: 100 requests/15min per IP
  - Room Creation: 5 rooms/15min per IP
  - Authentication: 10 attempts/15min per IP
  - Media Upload: 20 uploads/15min per IP
- [x] **Security Headers**: Helmet.js with comprehensive CSP protection
- [x] **Input Sanitization**: Express-validator middleware protecting all inputs
- [x] **File Upload Security**: Strict validation with 50MB limits and type checking

#### Database Optimization ✅
- [x] **Message Storage**: Separate Message collection prevents 16MB document limit
- [x] **Strategic Indexing**: Compound indexes for optimal query performance
- [x] **TTL Implementation**: Automatic cleanup of expired data
- [x] **Connection Optimization**: Proper pooling and timeout management

#### Code Quality ✅
- [x] **Modular Architecture**: Security middleware properly separated
- [x] **Environment Configuration**: All security settings configurable via .env
- [x] **Error Handling**: Comprehensive error handling and logging
- [x] **Testing Infrastructure**: Automated validation scripts created

**Phase 1 Testing Results:**
- ✅ Server starts successfully with all security middleware
- ✅ MongoDB connection optimized (no deprecated options)
- ✅ All security files properly implemented
- ✅ Rate limiting, security headers, and input sanitization active
- ✅ Application accessible at http://localhost:5000 with working CSS/JS

### 🚀 Future Development Phases

The application is currently running in its optimized Phase 1 state with all backend security and performance improvements. Future development phases may include:

- Frontend modernization with React and TypeScript
- Progressive Web App (PWA) implementation
- Enhanced chat features and UI improvements
- Advanced security features and analytics

### ✅ Phase 3: Advanced Features (COMPLETED)
**Status: COMPLETED ✅**

Advanced enterprise-level features have been successfully implemented:

#### End-to-End Encryption ✅
- [x] **AES-256-GCM Encryption**: Military-grade message encryption
- [x] **Room-Specific Keys**: Unique encryption keys per room
- [x] **Key Rotation**: Automatic security key rotation system
- [x] **RSA Key Pairs**: Asymmetric encryption for secure key exchange
- [x] **Message Integrity**: Authentication tags prevent tampering

#### Advanced Moderation Tools ✅
- [x] **Comprehensive Actions**: Warn, mute, kick, ban, restrict media
- [x] **Moderation Hierarchy**: Room owners and designated moderators
- [x] **Temporary Restrictions**: Time-based moderation with auto-expiry
- [x] **Moderation History**: Complete audit trail of all actions
- [x] **Bulk Actions**: Admin-level bulk moderation capabilities
- [x] **Permission System**: Granular permission control

#### API Rate Limiting Dashboard ✅
- [x] **Real-time Monitoring**: Live rate limiting statistics
- [x] **Connection Tracking**: Detailed connection history and analytics
- [x] **Top IP Analysis**: Identify heavy usage patterns
- [x] **Dynamic Configuration**: Runtime rate limit adjustments
- [x] **Admin Controls**: Reset stats and configure limits
- [x] **Analytics Integration**: Rate limiting data for insights

#### Analytics and Insights ✅
- [x] **Comprehensive Tracking**: All user and room interactions logged
- [x] **Dashboard Statistics**: Real-time usage analytics
- [x] **Hourly Trends**: Detailed time-based activity patterns
- [x] **Popular Rooms**: Room popularity and engagement scoring
- [x] **User Engagement**: Individual user activity metrics
- [x] **TTL Data Management**: Automatic cleanup of old analytics data

#### Multi-language Support ✅
- [x] **10 Languages**: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese
- [x] **Dynamic Translation**: Runtime language switching
- [x] **User Preferences**: Persistent language selection per user
- [x] **Browser Detection**: Automatic language detection
- [x] **Localized Formatting**: Number and date formatting per locale
- [x] **Admin Statistics**: Language usage tracking and analytics

**Phase 3 Testing Results:**
- ✅ End-to-end encryption working with key rotation
- ✅ Advanced moderation tools fully operational
- ✅ Rate limiting dashboard providing real-time insights
- ✅ Analytics system tracking all interactions
- ✅ Multi-language support with 10 languages active
- ✅ All Phase 3 APIs tested and functional

---

## �💡 Sample Usage scheduled rooms, managing member access, and ensuring conversations are private and transient.

![AetherMeet Application Banner](https://placehold.co/1200x400/1e293b/ffffff?text=AetherMeet&font=raleway)

## ✨ Key Features

### 🚀 Instant Demo Rooms (NEW!)
* **No Registration Required:** Create demo rooms instantly from the landing page
* **Any Password Works:** Use any alphanumeric password (123, abc, demo, etc.)
* **Quick Access:** Try demo rooms directly from header buttons
* **24-Hour Auto-Expiry:** Demo rooms automatically expire after 24 hours
* **Share Links:** Get instant shareable links with copy functionality
* **Unlimited Access:** Create as many demo rooms as needed

### 🔐 Authenticated Rooms
* **Secure User Authentication:** Standard user registration and login system using JSON Web Tokens (JWT)
* **Ephemeral Chat Rooms:** Rooms are designed to be temporary and can be destroyed by any member
* **Dual Room Creation Modes:**
    * **Instant Room:** Create a room on-the-fly for immediate conversations
    * **Scheduled Room:** Schedule a room to be created at a specific future date and time
* **Flexible Password System:** Any alphanumeric password works - simple and flexible
* **Advanced Admission Controls:**
    * **Owner Approval:** The room owner can manually accept or reject new members
    * **Democratic Voting:** Existing members can vote on admitting new users
    * **Instant Entry:** Demo rooms allow immediate access

### 💬 Chat & Media Features
* **Real-time Messaging:** Instant message delivery with Socket.IO
* **Media Sharing:** Upload and share images, videos, audio files, and documents
* **Message History:** Complete chat history with timestamps
* **PDF Export:** Export entire chat history to downloadable PDF files
* **User Management:** See online members, join/leave notifications

### 🎨 User Experience
* **Neo-Brutalism Design:** Modern, bold design with clean typography
* **Dark/Light Theme Toggle:** Switchable themes across all pages
* **Responsive Layout:** Works seamlessly on desktop and mobile
* **Accessible Interface:** Clean, emoji-free forms and intuitive navigation

## 🛠️ Tech Stack & Core Concepts

This project leverages a modern backend stack to handle its complex real-time, security, and scheduling requirements.

| Technology / Concept | Implementation in AetherMeet |
| :--- | :--- |
| **Node.js & Express.js** | Backend server for the REST API and serving the frontend. |
| **MongoDB & Mongoose** | Primary database with optimized schema and compound indexes for performance. |
| **WebSockets (Socket.IO)** | Powers all real-time features: messaging, admission voting, and live user lists. |
| **JWT & bcrypt.js** | Secures user authentication and hashes passwords for authenticated rooms. |
| **Express Rate Limit** | Advanced rate limiting to prevent abuse and ensure fair usage. |
| **Helmet.js** | Security middleware providing 11 layers of protection including CSP. |
| **`node-schedule`** | A flexible library for scheduling future tasks, used to create scheduled rooms. |
| **`multer`** | Handles secure file uploads with validation for media sharing. |
| **`pdfkit`** | Server-side library for dynamically generating PDF documents from chat history. |
| **EJS (Templating Engine)** | Renders the landing page, dashboard, and chat room UI with theme support. |
| **Tailwind CSS** | Utility-first CSS framework with neo-brutalism design system. |

## ⚙️ Installation & Setup

**Prerequisites:**
- Node.js (v14 or higher)
- MongoDB (local installation or cloud service like MongoDB Atlas)

1.  **Clone or navigate to the repository:**
    ```bash
    cd SayWhatever
    ```

2.  **Install dependencies (already done):**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    The `.env` file has been created with default values. Update as needed:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/aethermeet
    JWT_SECRET=your_super_secret_key_for_jwt_change_this_in_production
    DICTIONARY_API_KEY=your_dictionary_api_key_optional
    ```

4.  **Start MongoDB:**
    - If using local MongoDB: `mongod`
    - If using MongoDB Atlas: Update the `MONGO_URI` in `.env`

## 🚀 Usage

### Quick Demo (No Registration)
1. **Navigate to** `http://localhost:5000`
2. **Click "Try Demo"** in the header or hero section
3. **Instant Room Creation** - Demo room is created automatically
4. **Share the Link** - Copy the generated room link to invite others
5. **Start Chatting** - Begin messaging immediately with media support

### Full Platform Access
1. **Start the server:**
    ```bash
    npm run dev
    ```

2. **Access the application:**
    * Navigate to `http://localhost:5000`.
    * Sign up for a new account or log in.
    * From the dashboard, choose to "Create an Instant Room" or "Schedule a Room."
    * Configure your room's security settings (passwords, admission control).
    * Share the room code with others to invite them.

## 📝 API Endpoints

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user. | No |
| `POST` | `/api/auth/login` | Log in and receive a JWT. | No |
| `POST` | `/api/rooms/create-demo` | Create an instant demo room (no auth required). | No |
| `POST` | `/api/rooms/instant` | Create an instant authenticated room. | Yes |
| `POST` | `/api/rooms/schedule` | Schedule a room for the future. | Yes |
| `POST` | `/api/rooms/:roomCode/join` | Attempt to join a room with a password. | Yes |
| `GET` | `/api/rooms/:roomCode/export` | Triggers a PDF export of the chat history. | Yes |
| `POST` | `/api/media/upload` | Upload media files (images, videos, audio, documents). | Yes |
| `GET` | `/api/media/file/:filename` | Serve uploaded media files. | No |

## 🔌 WebSocket Events

The real-time logic is complex and managed through a series of custom events.

| Event Name | Direction | Description |
| :--- | :--- | :--- |
| `joinRoom` | C → S | Join a specific room by room code. |
| `sendMessage` | C → S | Send a chat message to the current room. |
| `sendMediaMessage` | C → S | Send a media message (image, video, audio, file). |
| `requestToJoin` | C → S | A user sends their password(s) to request entry into a room. |
| `approveAdmission` | C → S | Owner approves or denies admission requests. |
| `castVote` | C → S | A member casts their vote (`{ decision: 'admit' / 'deny' }`). |
| `leaveRoom` | C → S | Leave the current room with options for owners. |
| `dissolveRoom` | C → S | Any member can dissolve/destroy the room (demo rooms). |
| `roomJoined` | S → C | Confirmation of successful room join with room info. |
| `messageHistory` | S → C | Send chat history when user joins room. |
| `newMessage` | S → C | Broadcast new messages (text and media) to all room members. |
| `userJoined` | S → C | Broadcast to a room when a new user successfully joins. |
| `userLeft` | S → C | Broadcast when a user leaves the room. |
| `userAdmitted` | S → C | Broadcast when a pending user is admitted. |
| `admissionRequired`| S → C | Sent to the owner (or members) when a new user needs approval to join. |
| `pendingAdmissions` | S → C | Send list of pending admission requests. |
| `voteUpdate` | S → C | Update vote status for democratic admission. |
| `ownerTransfer` | S → C | Broadcast to a room to announce the new owner. |
| `roomDestroyed` | S → C | Broadcast to all members just before the room is closed. |
| `admissionResult` | S → C | Notify users of admission decision results. |

## 📁 Project Structure

```
aethermeet/
├── server.js                 # Main server file
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── README.md               # This file
├── models/                 # Database models
│   ├── User.js            # User model with authentication
│   └── Room.js            # Room model with demo room support
├── routes/                 # API routes
│   ├── auth.js            # Authentication routes
│   ├── rooms.js           # Room management routes (including demo rooms)
│   └── media.js           # Media upload and serving routes
├── socket/                 # Socket.IO handling
│   └── socketHandler.js   # Real-time event handlers
├── utils/                  # Utility functions
│   └── helpers.js         # JWT auth, password validation, etc.
├── views/                  # EJS templates
│   ├── index.ejs          # Landing page with demo room feature
│   ├── dashboard.ejs      # User dashboard with theme toggle
│   ├── room.ejs           # Chat room interface with media support
│   └── notes.ejs          # Notes management interface
├── storage/                # File storage
│   ├── media/             # Uploaded media files
│   └── pdfs/              # Generated PDF exports
└── public/                 # Static files
    ├── css/
    │   └── style.css      # Main stylesheet
    └── js/
        ├── auth.js        # Authentication frontend
        ├── dashboard.js   # Dashboard functionality
        └── room.js        # Real-time chat functionality
```

## 🎯 Features Implemented

### ✅ Core Features
- [x] User registration and authentication with JWT
- [x] Secure password hashing with bcrypt
- [x] **Instant Demo Rooms** (no registration required)
- [x] Room creation (instant and scheduled) for authenticated users
- [x] Flexible password validation (any alphanumeric characters)
- [x] Real-time chat with Socket.IO
- [x] **Media file sharing** (images, videos, audio, documents)
- [x] Owner approval and democratic voting for admissions
- [x] Room ownership transfer
- [x] **Room dissolution** (any member can destroy demo rooms)
- [x] **PDF chat export** with proper content generation
- [x] Responsive web interface with **dark/light theme toggle**

### ✅ Security Features
- [x] JWT-based authentication
- [x] Flexible password validation system
- [x] Input sanitization
- [x] Protected API routes
- [x] Socket authentication
- [x] File upload security with type validation

### ✅ Real-time Features
- [x] Live chat messaging with text and media
- [x] Real-time member lists
- [x] Admission request notifications
- [x] Voting system for member admission
- [x] Connection status indicators
- [x] **Real-time admission notifications**

### ✅ User Experience Features
- [x] **Neo-brutalism design** with Tailwind CSS
- [x] **Emoji-free interface** for clean accessibility
- [x] **Instant demo room creation** from landing page
- [x] **Share link generation** with copy functionality
- [x] **Theme toggle** across all pages
- [x] **Mobile-responsive design**

## 🔧 Configuration Notes

1. **MongoDB Connection**: Update `MONGO_URI` in `.env` to match your MongoDB setup
2. **JWT Secret**: Change `JWT_SECRET` to a secure, random string for production
3. **Port Configuration**: Default port is 5000, changeable via `PORT` environment variable
4. **File Storage**: Media files are stored in `storage/media/` directory
5. **Demo Room Expiry**: Demo rooms automatically expire after 24 hours

## 🚀 Getting Started Quickly

### Demo Mode (Fastest)
1. **Start MongoDB** (if running locally)
2. **Run the application**: `npm run dev`
3. **Open browser**: Go to `http://localhost:5000`
4. **Click "Try Demo"**: Creates instant demo room
5. **Share Link**: Copy the generated link to invite others

### Full Platform
1. **Follow demo steps 1-3 above**
2. **Register**: Create a new account
3. **Create Room**: Use "Create Instant Room" with any password
4. **Configure**: Set admission type (owner approval/democratic voting)
5. **Test Features**: Invite others using the room code

## � Security & Performance Improvements (Phase 1)

### 🛡️ Security Hardening
* **Rate Limiting**: Advanced rate limiting prevents abuse across all endpoints
  - General API: 100 requests per 15 minutes per IP
  - Room Creation: 5 rooms per 15 minutes per IP  
  - Authentication: 10 attempts per 15 minutes per IP
  - Media Upload: 20 uploads per 15 minutes per IP
* **Input Sanitization**: Comprehensive input sanitization prevents XSS attacks
* **Security Headers**: Helmet.js implementation with CSP protection
* **File Upload Security**: Strict file type validation and size limits (50MB max)
* **Content Security Policy**: Prevents unauthorized script execution

### ⚡ Database Optimization
* **Separate Message Collection**: Messages moved to dedicated collection to prevent 16MB limit
* **Compound Indexes**: Strategic indexing for optimal query performance
* **TTL Indexes**: Automatic cleanup of expired demo rooms and old messages
* **Query Optimization**: Efficient pagination and message retrieval

### 📊 Performance Enhancements
* **Message Pagination**: Load messages efficiently with cursor-based pagination  
* **Database Indexes**: Optimized queries with compound indexes on critical fields
* **Memory Management**: Reduced memory usage with separated message storage
* **Connection Pooling**: Optimized MongoDB connection management

## �💡 Sample Usage

### Demo Room
1. **Landing Page**: Click "Try Demo" button
2. **Instant Creation**: Room created automatically with random password
3. **Share**: Copy the provided link
4. **Join**: Others can join with the link and password
5. **Chat**: Start messaging with media support immediately

### Authenticated Room
1. **Registration**: Use any username, email, and password (min 6 characters)
2. **Room Creation**: 
   - Name: "Project Meeting"
   - Primary Password: "meeting123" (any alphanumeric)
   - Admission Type: "Owner Approval"
3. **Room Joining**: Share the 6-character room code with others
4. **Chat**: Start messaging with full media support
5. **PDF Export**: Click "Export PDF" to download chat history

## 🎨 UI Features

- **Neo-Brutalism Design**: Bold, modern aesthetic with sharp edges and strong contrast
- **Dark/Light Theme Toggle**: Persistent theme switching across all pages
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Real-time Updates**: Live member counts and message delivery indicators
- **Clean Interface**: Emoji-free forms and accessible design
- **Interactive Modals**: Smooth modal interactions for all actions
- **Media Preview**: In-chat preview for images, videos, and audio files
