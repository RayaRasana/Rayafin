import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { User, UserState } from "../types";
import { userAPI } from "../api/users";

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (companyId?: number, { rejectWithValue }) => {
    try {
      const data = await userAPI.getAll(companyId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch users");
    }
  }
);

const initialState: UserState = {
  items: [],
  selectedUser: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.items = action.payload;
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.items.push(action.payload);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.items.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteUser: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((u) => u.id !== action.payload);
    },
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setLoading,
  setError,
  setUsers,
  addUser,
  updateUser,
  deleteUser,
  setSelectedUser,
} = userSlice.actions;

export default userSlice.reducer;
