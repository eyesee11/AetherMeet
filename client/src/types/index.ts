// User types
export interface User {
  id: string;
  username: string;
  email: string;
  isAuthenticated: boolean;
}

// Room types
export interface Room {
  id: string;
  name: string;
  code: string;
  isDemo: boolean;
  owner?: string;
  participants: string[];
  admissionType: 'instant' | 'owner_approval' | 'democratic_voting';
  isScheduled: boolean;
  scheduledFor?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

// Message types
export interface Message {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  type: 'text' | 'media' | 'system';
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  mediaName?: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
}

// Socket events
export interface SocketEvents {
  // Client to Server
  joinRoom: (data: { roomCode: string; password?: string }) => void;
  sendMessage: (data: { content: string; type: 'text' }) => void;
  sendMediaMessage: (data: { content: string; type: 'media'; mediaType: string; mediaUrl: string; mediaName: string }) => void;
  leaveRoom: () => void;
  startTyping: () => void;
  stopTyping: () => void;
  
  // Server to Client
  roomJoined: (data: { room: Room; messages: Message[] }) => void;
  newMessage: (message: Message) => void;
  userJoined: (data: { username: string; userId: string }) => void;
  userLeft: (data: { username: string; userId: string }) => void;
  userTyping: (data: { username: string; userId: string }) => void;
  userStoppedTyping: (data: { username: string; userId: string }) => void;
  messageHistory: (messages: Message[]) => void;
  error: (data: { message: string }) => void;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Theme types
export type ThemeMode = 'light' | 'dark';

// UI State types
export interface UIState {
  theme: ThemeMode;
  sidebarOpen: boolean;
  isLoading: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateRoomForm {
  name: string;
  password: string;
  admissionType: Room['admissionType'];
  isScheduled: boolean;
  scheduledFor?: Date;
}

// Redux store types
export interface RootState {
  auth: AuthState;
  rooms: RoomsState;
  messages: MessagesState;
  ui: UIState;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface RoomsState {
  currentRoom: Room | null;
  rooms: Room[];
  isLoading: boolean;
  error: string | null;
}

export interface MessagesState {
  messages: Message[];
  typingUsers: string[];
  isLoading: boolean;
  error: string | null;
}
