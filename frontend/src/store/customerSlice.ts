import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Customer, CustomerState } from "../types";

const initialState: CustomerState = {
  items: [],
  selectedCustomer: null,
  loading: false,
  error: null,
};

const customerSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCustomers: (state, action: PayloadAction<Customer[]>) => {
      state.items = action.payload;
    },
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.items.push(action.payload);
    },
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.items.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteCustomer: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
    setSelectedCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.selectedCustomer = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  setSelectedCustomer,
} = customerSlice.actions;

export default customerSlice.reducer;
