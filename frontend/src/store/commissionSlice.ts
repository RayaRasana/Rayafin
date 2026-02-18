import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Commission, CommissionState } from "../types";

const initialState: CommissionState = {
  items: [],
  selectedCommission: null,
  loading: false,
  error: null,
};

const commissionSlice = createSlice({
  name: "commissions",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCommissions: (state, action: PayloadAction<Commission[]>) => {
      state.items = action.payload;
    },
    addCommission: (state, action: PayloadAction<Commission>) => {
      state.items.push(action.payload);
    },
    updateCommission: (state, action: PayloadAction<Commission>) => {
      const index = state.items.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteCommission: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
    setSelectedCommission: (state, action: PayloadAction<Commission | null>) => {
      state.selectedCommission = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setCommissions,
  addCommission,
  updateCommission,
  deleteCommission,
  setSelectedCommission,
} = commissionSlice.actions;

export default commissionSlice.reducer;
