import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket as SocketIOClient } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  addMessage, 
  addTypingUser, 
  removeTypingUser, 
  setMessages,
  clearMessages 
} from '../store/slices/messagesSlice';
import { 
  setCurrentRoom, 
  addParticipant, 
  removeParticipant 
} from '../store/slices/roomsSlice';
import { showError, showInfo } from '../store/slices/uiSlice';
import type { Message, Room } from '../types';

interface SocketContextType {
  socket: SocketIOClient | null;
  connected: boolean;
  joinRoom: (roomCode: string, password?: string) => void;
  leaveRoom: () => void;
  sendMessage: (content: string) => void;
  sendMediaMessage: (content: string, mediaType: string, mediaUrl: string, mediaName: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<SocketIOClient | null>(null);
  const [connected, setConnected] = useState(false);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { currentRoom } = useAppSelector(state => state.rooms);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token'),
      },
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
      dispatch(showError({
        title: 'Connection Error',
        message: 'Failed to connect to server. Please check your internet connection.',
      }));
    });

    // Room events
    newSocket.on('roomJoined', (data: { room: Room; messages: Message[] }) => {
      dispatch(setCurrentRoom(data.room));
      dispatch(setMessages(data.messages));
      dispatch(showInfo({
        title: 'Room Joined',
        message: `Successfully joined ${data.room.name}`,
        duration: 2000,
      }));
    });

    newSocket.on('messageHistory', (messages: Message[]) => {
      dispatch(setMessages(messages));
    });

    newSocket.on('newMessage', (message: Message) => {
      dispatch(addMessage(message));
    });

    newSocket.on('userJoined', (data: { username: string; userId: string }) => {
      dispatch(addParticipant(data.userId));
      dispatch(showInfo({
        title: 'User Joined',
        message: `${data.username} joined the room`,
        duration: 2000,
      }));
    });

    newSocket.on('userLeft', (data: { username: string; userId: string }) => {
      dispatch(removeParticipant(data.userId));
      dispatch(showInfo({
        title: 'User Left',
        message: `${data.username} left the room`,
        duration: 2000,
      }));
    });

    newSocket.on('userTyping', (data: { username: string; userId: string }) => {
      if (data.userId !== user?.id) {
        dispatch(addTypingUser(data.username));
      }
    });

    newSocket.on('userStoppedTyping', (data: { username: string; userId: string }) => {
      dispatch(removeTypingUser(data.username));
    });

    newSocket.on('roomDestroyed', () => {
      dispatch(setCurrentRoom(null));
      dispatch(clearMessages());
      dispatch(showInfo({
        title: 'Room Closed',
        message: 'The room has been closed by the owner',
        duration: 3000,
      }));
    });

    newSocket.on('error', (data: { message: string }) => {
      dispatch(showError({
        title: 'Error',
        message: data.message,
      }));
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [dispatch, user?.id]);

  const joinRoom = (roomCode: string, password?: string) => {
    if (socket) {
      socket.emit('joinRoom', { roomCode, password });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leaveRoom');
      dispatch(setCurrentRoom(null));
      dispatch(clearMessages());
    }
  };

  const sendMessage = (content: string) => {
    if (socket && currentRoom) {
      socket.emit('sendMessage', { content, type: 'text' });
    }
  };

  const sendMediaMessage = (content: string, mediaType: string, mediaUrl: string, mediaName: string) => {
    if (socket && currentRoom) {
      socket.emit('sendMediaMessage', { 
        content, 
        type: 'media', 
        mediaType, 
        mediaUrl, 
        mediaName 
      });
    }
  };

  const startTyping = () => {
    if (socket && currentRoom) {
      socket.emit('startTyping');
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    }
  };

  const stopTyping = () => {
    if (socket && currentRoom) {
      socket.emit('stopTyping');
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const contextValue: SocketContextType = {
    socket,
    connected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendMediaMessage,
    startTyping,
    stopTyping,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
