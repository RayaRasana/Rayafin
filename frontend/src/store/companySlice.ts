import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Company, CompanyState } from "../types";

const initialState: CompanyState = {
  items: [],
  selectedCompany: null,
  loading: false,
  error: null,
};

const companySlice = createSlice({
  name: "companies",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.items = action.payload;
    },
    addCompany: (state, action: PayloadAction<Company>) => {
      state.items.push(action.payload);
    },
    updateCompany: (state, action: PayloadAction<Company>) => {
      const index = state.items.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteCompany: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
    setSelectedCompany: (state, action: PayloadAction<Company | null>) => {
      state.selectedCompany = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setCompanies,
  addCompany,
  updateCompany,
  deleteCompany,
  setSelectedCompany,
} = companySlice.actions;

export default companySlice.reducer;
