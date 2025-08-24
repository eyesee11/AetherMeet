import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MessagesState, Message } from '../../types';

const initialState: MessagesState = {
  messages: [],
  typingUsers: [],
  isLoading: false,
  error: null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const existingIndex = state.messages.findIndex(msg => msg.id === action.payload.id);
      if (existingIndex === -1) {
        state.messages.push(action.payload);
        // Keep only last 1000 messages in memory for performance
        if (state.messages.length > 1000) {
          state.messages = state.messages.slice(-1000);
        }
      }
    },
    updateMessage: (state, action: PayloadAction<{ id: string; updates: Partial<Message> }>) => {
      const messageIndex = state.messages.findIndex(msg => msg.id === action.payload.id);
      if (messageIndex !== -1) {
        state.messages[messageIndex] = { ...state.messages[messageIndex], ...action.payload.updates };
      }
    },
    removeMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(msg => msg.id !== action.payload);
    },
    addTypingUser: (state, action: PayloadAction<string>) => {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser: (state, action: PayloadAction<string>) => {
      state.typingUsers = state.typingUsers.filter(user => user !== action.payload);
    },
    clearTypingUsers: (state) => {
      state.typingUsers = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.typingUsers = [];
      state.error = null;
    },
    // Optimistic message updates for better UX
    addOptimisticMessage: (state, action: PayloadAction<Omit<Message, 'id' | 'timestamp'> & { tempId: string }>) => {
      const tempMessage: Message = {
        ...action.payload,
        id: action.payload.tempId,
        timestamp: new Date(),
      };
      state.messages.push(tempMessage);
    },
    removeOptimisticMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(msg => msg.id !== action.payload);
    },
    confirmOptimisticMessage: (state, action: PayloadAction<{ tempId: string; message: Message }>) => {
      const messageIndex = state.messages.findIndex(msg => msg.id === action.payload.tempId);
      if (messageIndex !== -1) {
        state.messages[messageIndex] = action.payload.message;
      }
    },
  },
});

export const {
  setMessages,
  addMessage,
  updateMessage,
  removeMessage,
  addTypingUser,
  removeTypingUser,
  clearTypingUsers,
  setLoading,
  setError,
  clearMessages,
  addOptimisticMessage,
  removeOptimisticMessage,
  confirmOptimisticMessage,
} = messagesSlice.actions;

export default messagesSlice.reducer;
