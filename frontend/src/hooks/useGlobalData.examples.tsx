/**
 * Global Data Preloading System - Usage Examples
 * 
 * The app automatically preloads Companies, Users, and Products globally
 * after successful authentication. Use these hooks to access the data.
 */

import React from "react";
import {
  useCompanies,
  useUsers,
  useProducts,
  useGlobalData,
  useGlobalDataStatus,
  useGlobalDataRefresh,
} from "../hooks/useGlobalData";

/**
 * Example 1: Basic usage with individual hooks
 */
export const ExampleBasicUsage: React.FC = () => {
  const { companies, loading: companiesLoading, error: companiesError } =
    useCompanies();
  const { users, loading: usersLoading } = useUsers();
  const { products, loading: productsLoading } = useProducts();

  return (
    <div>
      <h2>Companies ({companies.length})</h2>
      {companiesLoading && <p>Loading...</p>}
      {companiesError && <p>Error: {companiesError}</p>}
      {companies.map((company: any) => (
        <div key={company.id}>{company.name}</div>
      ))}

      <h2>Users ({users.length})</h2>
      {usersLoading && <p>Loading...</p>}
      {users.map((user: any) => (
        <div key={user.id}>{user.full_name}</div>
      ))}

      <h2>Products ({products.length})</h2>
      {productsLoading && <p>Loading...</p>}
      {products.map((product: any) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
};

/**
 * Example 2: Combined usage with useGlobalData
 */
export const ExampleCombinedUsage: React.FC = () => {
  const { companies, users, products, isPreloading, preloadError } =
    useGlobalData();

  if (isPreloading) {
    return <p>Loading global data...</p>;
  }

  if (preloadError) {
    return <p>Error loading data: {preloadError}</p>;
  }

  return (
    <div>
      <p>Companies: {companies.length}</p>
      <p>Users: {users.length}</p>
      <p>Products: {products.length}</p>
    </div>
  );
};

/**
 * Example 3: Check preload status
 */
export const ExamplePreloadStatus: React.FC = () => {
  const { isPreloaded, isPreloading, lastPreloadTime } =
    useGlobalDataStatus();

  return (
    <div>
      <p>Data preloaded: {isPreloaded ? "Yes" : "No"}</p>
      <p>Currently preloading: {isPreloading ? "Yes" : "No"}</p>
      {lastPreloadTime && (
        <p>Last preload: {new Date(lastPreloadTime).toLocaleString()}</p>
      )}
    </div>
  );
};

/**
 * Example 4: Refresh data on demand
 */
export const ExampleRefreshData: React.FC = () => {
  const { companies } = useCompanies();
  const {
    refreshCompanies,
    refreshUsers,
    refreshProducts,
    refreshAll,
  } = useGlobalDataRefresh();

  return (
    <div>
      <p>Companies: {companies.length}</p>
      <button onClick={() => refreshCompanies()}>Refresh Companies</button>
      <button onClick={() => refreshUsers()}>Refresh Users</button>
      <button onClick={() => refreshProducts(companies[0]?.id || 1)}>
        Refresh Products
      </button>
      <button onClick={() => refreshAll(companies[0]?.id)}>Refresh All</button>
    </div>
  );
};

/**
 * Example 5: Real-world component using global data
 */
export const ExampleRealWorldComponent: React.FC = () => {
  const { companies, users, products, isPreloading } = useGlobalData();
  const { refreshAll } = useGlobalDataRefresh();

  const handleRefresh = async () => {
    await refreshAll();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>

      {isPreloading && <div>Loading data...</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div style={{ padding: "10px", border: "1px solid #ccc" }}>
          <h3>Companies</h3>
          <p>{companies.length} companies available</p>
          <ul>
            {companies.slice(0, 3).map((c: any) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        </div>

        <div style={{ padding: "10px", border: "1px solid #ccc" }}>
          <h3>Users</h3>
          <p>{users.length} users available</p>
          <ul>
            {users.slice(0, 3).map((u: any) => (
              <li key={u.id}>{u.full_name}</li>
            ))}
          </ul>
        </div>

        <div style={{ padding: "10px", border: "1px solid #ccc" }}>
          <h3>Products</h3>
          <p>{products.length} products available</p>
          <ul>
            {products.slice(0, 3).map((p: any) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={handleRefresh}
        style={{ marginTop: "20px", padding: "10px 20px" }}
      >
        Refresh All Data
      </button>
    </div>
  );
};
