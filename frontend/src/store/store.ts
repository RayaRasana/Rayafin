import { configureStore } from "@reduxjs/toolkit";
import companyReducer from "./companySlice";
import customerReducer from "./customerSlice";
import productReducer from "./productSlice";
import userReducer from "./userSlice";
import invoiceReducer from "./invoiceSlice";
import commissionReducer from "./commissionSlice";
import preloadReducer from "./preloadSlice";

export const store = configureStore({
  reducer: {
    companies: companyReducer,
    customers: customerReducer,
    products: productReducer,
    users: userReducer,
    invoices: invoiceReducer,
    commissions: commissionReducer,
    preload: preloadReducer,  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;