import { createSlice } from "@reduxjs/toolkit";
import { fetchCompanies } from "./companySlice";
import { fetchUsers } from "./userSlice";
import { fetchProducts } from "./productSlice";

interface PreloadState {
  isPreloaded: boolean;
  isPreloading: boolean;
  preloadError: string | null;
  lastPreloadTime: number | null;
}

const initialState: PreloadState = {
  isPreloaded: false,
  isPreloading: false,
  preloadError: null,
  lastPreloadTime: null,
};

const preloadSlice = createSlice({
  name: "preload",
  initialState,
  reducers: {
    resetPreload: (state) => {
      state.isPreloaded = false;
      state.isPreloading = false;
      state.preloadError = null;
      state.lastPreloadTime = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Companies
      .addCase(fetchCompanies.pending, (state) => {
        state.isPreloading = true;
        state.preloadError = null;
      })
      .addCase(fetchCompanies.fulfilled, (state) => {
        state.isPreloaded = true;
        state.lastPreloadTime = Date.now();
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.preloadError = action.payload as string;
      })
      // Users
      .addCase(fetchUsers.pending, (state) => {
        state.isPreloading = true;
        state.preloadError = null;
      })
      .addCase(fetchUsers.fulfilled, (state) => {
        state.lastPreloadTime = Date.now();
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.preloadError = action.payload as string;
      })
      // Products
      .addCase(fetchProducts.pending, (state) => {
        state.isPreloading = true;
        state.preloadError = null;
      })
      .addCase(fetchProducts.fulfilled, (state) => {
        state.isPreloaded = true;
        state.lastPreloadTime = Date.now();
        state.isPreloading = false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.preloadError = action.payload as string;
        state.isPreloading = false;
      });
  },
});

export const { resetPreload } = preloadSlice.actions;
export default preloadSlice.reducer;
