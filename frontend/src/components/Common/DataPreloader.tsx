import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/store";
import { fetchCompanies } from "../../store/companySlice";
import { fetchUsers } from "../../store/userSlice";
import { fetchProducts } from "../../store/productSlice";
import { useAuth } from "../../context/AuthContext";

interface DataPreloaderProps {
  children: React.ReactNode;
}

export const DataPreloader: React.FC<DataPreloaderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useAuth();
  const preloadAttemptedRef = useRef<boolean>(false);

  useEffect(() => {
    // Preload data only once after successful authentication
    if (isAuthenticated && user && !preloadAttemptedRef.current) {
      preloadAttemptedRef.current = true;

      const preloadGlobalData = async () => {
        try {
          // Load companies first
          await dispatch(fetchCompanies());

          // Load users (optionally filtered by user's company)
          const companyId = user.company_id;
          await dispatch(fetchUsers(companyId));

          // Load products if user has a company context
          if (companyId) {
            await dispatch(fetchProducts(companyId));
          }
        } catch (error) {
          console.error("Failed to preload global data:", error);
          // Silently fail - data can still be loaded on-demand
        }
      };

      preloadGlobalData();
    }

    // Reset preload flag on logout
    if (!isAuthenticated && preloadAttemptedRef.current) {
      preloadAttemptedRef.current = false;
    }
  }, [isAuthenticated, user, dispatch]);

  return <>{children}</>;
};
