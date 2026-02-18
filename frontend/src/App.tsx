import React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { theme } from "./theme/theme";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Common/Layout";
import { ProtectedRoute } from "./components/Common/ProtectedRoute";
import { LoginPage } from "./pages/Login";
import { CompanyList } from "./components/Company/CompanyList";
import { CustomerList } from "./components/Customer/CustomerList";
import { UserList } from "./components/User/UserList";
import { InvoiceList } from "./components/Invoice/InvoiceList";
import { CommissionList } from "./components/Commission/CommissionList";

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CompanyList />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CustomerList />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <UserList />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <InvoiceList />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/commissions"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CommissionList />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
