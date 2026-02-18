import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, UserState } from "../types";

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
