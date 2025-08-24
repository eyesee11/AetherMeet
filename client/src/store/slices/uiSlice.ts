import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UIState, ThemeMode, Notification } from '../../types';

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('theme') as ThemeMode;
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const initialState: UIState = {
  theme: getInitialTheme(),
  sidebarOpen: false,
  isLoading: false,
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      // Apply theme to document
      document.documentElement.classList.toggle('dark', action.payload === 'dark');
    },
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };
      state.notifications.push(notification);
      
      // Auto-remove notification after duration
      if (notification.duration !== 0) {
        setTimeout(() => {
          // This will be handled by the component
        }, notification.duration || 5000);
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    // Quick notification helpers
    showSuccess: (state, action: PayloadAction<{ title: string; message: string; duration?: number }>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'success',
        title: action.payload.title,
        message: action.payload.message,
        duration: action.payload.duration || 3000,
      };
      state.notifications.push(notification);
    },
    showError: (state, action: PayloadAction<{ title: string; message: string; duration?: number }>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'error',
        title: action.payload.title,
        message: action.payload.message,
        duration: action.payload.duration || 5000,
      };
      state.notifications.push(notification);
    },
    showWarning: (state, action: PayloadAction<{ title: string; message: string; duration?: number }>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'warning',
        title: action.payload.title,
        message: action.payload.message,
        duration: action.payload.duration || 4000,
      };
      state.notifications.push(notification);
    },
    showInfo: (state, action: PayloadAction<{ title: string; message: string; duration?: number }>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'info',
        title: action.payload.title,
        message: action.payload.message,
        duration: action.payload.duration || 3000,
      };
      state.notifications.push(notification);
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setSidebarOpen,
  toggleSidebar,
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} = uiSlice.actions;

export default uiSlice.reducer;
