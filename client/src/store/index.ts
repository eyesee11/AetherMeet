import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import roomsReducer from './slices/roomsSlice';
import messagesReducer from './slices/messagesSlice';
import uiReducer from './slices/uiSlice';
import type { RootState } from '../types';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rooms: roomsReducer,
    messages: messagesReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['messages.messages.timestamp', 'rooms.currentRoom.createdAt'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
