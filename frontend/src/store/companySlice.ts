import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { Company, CompanyState } from "../types";
import { companyAPI } from "../api/companies";

export const fetchCompanies = createAsyncThunk(
  "companies/fetchCompanies",
  async (_, { rejectWithValue }) => {
    try {
      const data = await companyAPI.getAll();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch companies");
    }
  }
);

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
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
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
