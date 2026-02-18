import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Invoice, InvoiceState } from "../types";

const initialState: InvoiceState = {
  items: [],
  selectedInvoice: null,
  loading: false,
  error: null,
};

const invoiceSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setInvoices: (state, action: PayloadAction<Invoice[]>) => {
      state.items = action.payload;
    },
    addInvoice: (state, action: PayloadAction<Invoice>) => {
      state.items.push(action.payload);
    },
    updateInvoice: (state, action: PayloadAction<Invoice>) => {
      const index = state.items.findIndex((i) => i.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteInvoice: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    setSelectedInvoice: (state, action: PayloadAction<Invoice | null>) => {
      state.selectedInvoice = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setInvoices,
  addInvoice,
  updateInvoice,
  deleteInvoice,
  setSelectedInvoice,
} = invoiceSlice.actions;

export default invoiceSlice.reducer;
