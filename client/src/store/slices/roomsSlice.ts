import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RoomsState, Room, CreateRoomForm, ApiResponse } from '../../types';
import api from '../../utils/api';

// Async thunks
export const createInstantRoom = createAsyncThunk(
  'rooms/createInstant',
  async (roomData: CreateRoomForm, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<Room>>('/api/rooms/instant', roomData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create room');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create room');
    }
  }
);

export const createDemoRoom = createAsyncThunk(
  'rooms/createDemo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<Room>>('/api/rooms/demo');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create demo room');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create demo room');
    }
  }
);

export const joinRoom = createAsyncThunk(
  'rooms/join',
  async (data: { roomCode: string; password?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<Room>>(`/api/rooms/${data.roomCode}/join`, {
        password: data.password,
      });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to join room');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to join room');
    }
  }
);

export const getUserRooms = createAsyncThunk(
  'rooms/getUserRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<Room[]>>('/api/rooms/user');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch rooms');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch rooms');
    }
  }
);

const initialState: RoomsState = {
  currentRoom: null,
  rooms: [],
  isLoading: false,
  error: null,
};

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setCurrentRoom: (state, action: PayloadAction<Room | null>) => {
      state.currentRoom = action.payload;
    },
    updateCurrentRoom: (state, action: PayloadAction<Partial<Room>>) => {
      if (state.currentRoom) {
        state.currentRoom = { ...state.currentRoom, ...action.payload };
      }
    },
    addParticipant: (state, action: PayloadAction<string>) => {
      if (state.currentRoom) {
        state.currentRoom.participants.push(action.payload);
      }
    },
    removeParticipant: (state, action: PayloadAction<string>) => {
      if (state.currentRoom) {
        state.currentRoom.participants = state.currentRoom.participants.filter(
          (id) => id !== action.payload
        );
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    leaveCurrentRoom: (state) => {
      state.currentRoom = null;
    },
  },
  extraReducers: (builder) => {
    // Create instant room
    builder
      .addCase(createInstantRoom.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createInstantRoom.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRoom = action.payload;
        state.rooms.push(action.payload);
        state.error = null;
      })
      .addCase(createInstantRoom.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
    // Create demo room
      .addCase(createDemoRoom.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDemoRoom.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRoom = action.payload;
        state.error = null;
      })
      .addCase(createDemoRoom.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
    // Join room
      .addCase(joinRoom.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRoom = action.payload;
        state.error = null;
      })
      .addCase(joinRoom.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
    // Get user rooms
      .addCase(getUserRooms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserRooms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rooms = action.payload;
        state.error = null;
      })
      .addCase(getUserRooms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentRoom,
  updateCurrentRoom,
  addParticipant,
  removeParticipant,
  clearError,
  leaveCurrentRoom,
} = roomsSlice.actions;

export default roomsSlice.reducer;
