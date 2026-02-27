import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store/store";
import { fetchCompanies } from "../store/companySlice";
import { fetchUsers } from "../store/userSlice";
import { fetchProducts } from "../store/productSlice";
import { resetPreload } from "../store/preloadSlice";

export const useCompanies = () => {
  const companies = useSelector((state: RootState) => state.companies.items);
  const loading = useSelector((state: RootState) => state.companies.loading);
  const error = useSelector((state: RootState) => state.companies.error);

  return {
    companies,
    loading,
    error,
  };
};

export const useUsers = () => {
  const users = useSelector((state: RootState) => state.users.items);
  const loading = useSelector((state: RootState) => state.users.loading);
  const error = useSelector((state: RootState) => state.users.error);

  return {
    users,
    loading,
    error,
  };
};

export const useProducts = () => {
  const products = useSelector((state: RootState) => state.products.items);
  const loading = useSelector((state: RootState) => state.products.loading);
  const error = useSelector((state: RootState) => state.products.error);

  return {
    products,
    loading,
    error,
  };
};

export const useGlobalDataStatus = () => {
  const isPreloaded = useSelector(
    (state: RootState) => state.preload.isPreloaded
  );
  const isPreloading = useSelector(
    (state: RootState) => state.preload.isPreloading
  );
  const preloadError = useSelector(
    (state: RootState) => state.preload.preloadError
  );
  const lastPreloadTime = useSelector(
    (state: RootState) => state.preload.lastPreloadTime
  );

  return {
    isPreloaded,
    isPreloading,
    preloadError,
    lastPreloadTime,
  };
};

export const useGlobalDataRefresh = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { companies } = useCompanies();

  const refreshCompanies = useCallback(async () => {
    await dispatch(fetchCompanies());
  }, [dispatch]);

  const refreshUsers = useCallback(
    async (companyId?: number) => {
      await dispatch(fetchUsers(companyId));
    },
    [dispatch]
  );

  const refreshProducts = useCallback(
    async (companyId: number) => {
      await dispatch(fetchProducts(companyId));
    },
    [dispatch]
  );

  const refreshAll = useCallback(
    async (companyId?: number) => {
      await Promise.all([
        dispatch(fetchCompanies()),
        dispatch(fetchUsers(companyId)),
        ...(companyId ? [dispatch(fetchProducts(companyId))] : []),
      ]);
    },
    [dispatch]
  );

  const resetAll = useCallback(() => {
    dispatch(resetPreload());
  }, [dispatch]);

  return {
    refreshCompanies,
    refreshUsers,
    refreshProducts,
    refreshAll,
    resetAll,
  };
};

export const useGlobalData = () => {
  const companies = useCompanies().companies;
  const users = useUsers().users;
  const products = useProducts().products;
  const { isPreloaded, isPreloading, preloadError } = useGlobalDataStatus();

  return {
    companies,
    users,
    products,
    isPreloaded,
    isPreloading,
    preloadError,
  };
};
