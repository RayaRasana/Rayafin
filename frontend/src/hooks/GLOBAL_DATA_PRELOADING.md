# Global Data Preloading System

## Overview

Companies, Users, and Products are now preloaded globally immediately after authentication. This eliminates the need to fetch data each time a user switches tabs and provides a better user experience with faster data access.

## Architecture

### Files Created/Modified

1. **Store Slices (Enhanced)**
   - `store/companySlice.ts` - Added `fetchCompanies` async thunk
   - `store/userSlice.ts` - Added `fetchUsers` async thunk
   - `store/productSlice.ts` - Added `fetchProducts` async thunk
   - `store/preloadSlice.ts` - NEW - Manages global preload state
   - `store/store.ts` - Updated to include preloadSlice

2. **Components**
   - `components/Common/DataPreloader.tsx` - NEW - Handles automatic data preloading on auth

3. **Hooks**
   - `hooks/useGlobalData.ts` - NEW - Custom hooks for accessing global data

4. **App Integration**
   - `App.tsx` - Updated to wrap routes with DataPreloader

## How It Works

### 1. Authentication Flow
```
User Login → AuthProvider → DataPreloader detects auth → Preload Companies, Users, Products
```

### 2. Preload Process
The DataPreloader component:
- Watches for `isAuthenticated` and `user` changes
- Runs once after successful login (tracked via useRef)
- Dispatches fetchCompanies, fetchUsers, fetchProducts thunks
- Data is stored in Redux state
- Handles errors gracefully (silent fail - data can be loaded on-demand)

### 3. Data Access
Components access preloaded data via custom hooks:
- `useCompanies()` - Get companies array + loading/error states
- `useUsers()` - Get users array + loading/error states
- `useProducts()` - Get products array + loading/error states
- `useGlobalData()` - Get all three + preload status
- `useGlobalDataRefresh()` - Manual refresh/reset functions

## Usage Examples

### Basic Usage - Get Companies
```typescript
import { useCompanies } from "../hooks/useGlobalData";

export const MyComponent: React.FC = () => {
  const { companies, loading, error } = useCompanies();

  if (loading) return <div>Loading companies...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {companies.map(c => <li key={c.id}>{c.name}</li>)}
    </ul>
  );
};
```

### Combined Usage - All Global Data
```typescript
import { useGlobalData } from "../hooks/useGlobalData";

export const Dashboard: React.FC = () => {
  const { companies, users, products, isPreloading } = useGlobalData();

  if (isPreloading) return <div>Loading data...</div>;

  return (
    <div>
      <p>Companies: {companies.length}</p>
      <p>Users: {users.length}</p>
      <p>Products: {products.length}</p>
    </div>
  );
};
```

### Check Preload Status
```typescript
import { useGlobalDataStatus } from "../hooks/useGlobalData";

export const StatusIndicator: React.FC = () => {
  const { isPreloaded, isPreloading, lastPreloadTime } = useGlobalDataStatus();

  return (
    <div>
      <p>Preloaded: {isPreloaded ? "Yes" : "No"}</p>
      <p>Preloading: {isPreloading ? "Yes" : "No"}</p>
      {lastPreloadTime && <p>Last: {new Date(lastPreloadTime).toLocaleString()}</p>}
    </div>
  );
};
```

### Manual Refresh
```typescript
import { useGlobalDataRefresh } from "../hooks/useGlobalData";

export const RefreshButton: React.FC = () => {
  const { refreshAll } = useGlobalDataRefresh();

  return (
    <button onClick={() => refreshAll()}>
      Refresh All Data
    </button>
  );
};
```

## API Reference

### Hooks

#### `useCompanies()`
Returns: `{ companies: Company[], loading: boolean, error: string | null }`

#### `useUsers()`
Returns: `{ users: User[], loading: boolean, error: string | null }`

#### `useProducts()`
Returns: `{ products: Product[], loading: boolean, error: string | null }`

#### `useGlobalData()`
Returns all three datasets plus status:
```typescript
{
  companies: Company[];
  users: User[];
  products: Product[];
  isPreloaded: boolean;
  isPreloading: boolean;
  preloadError: string | null;
}
```

#### `useGlobalDataStatus()`
Returns preload status:
```typescript
{
  isPreloaded: boolean;
  isPreloading: boolean;
  preloadError: string | null;
  lastPreloadTime: number | null;
}
```

#### `useGlobalDataRefresh()`
Returns refresh functions:
```typescript
{
  refreshCompanies: () => Promise<void>;
  refreshUsers: (companyId?: number) => Promise<void>;
  refreshProducts: (companyId: number) => Promise<void>;
  refreshAll: (companyId?: number) => Promise<void>;
  resetAll: () => void;
}
```

## Features

✅ **No Duplicate API Calls**
- Data preloaded once after login
- useRef tracking prevents multiple preloads
- Redux state caching prevents re-renders

✅ **Proper Loading States**
- Per-data loading flags
- Global preload status
- Error states tracked

✅ **Multi-Tenant Ready**
- Respects user.company_id context
- Handles optional company filters
- Products filtered by company

✅ **RBAC Compatible**
- No changes to permission system
- Works with existing hasPermission() logic
- User role preserved

✅ **Performance Optimized**
- Data preloaded in parallel
- Prevents unnecessary re-renders
- Silent failure for on-demand loading

✅ **Manual Control**
- `refreshAll()` for manual refetch
- `resetAll()` to clear preload state
- Individual refresh functions available

## Redux State Structure

```typescript
state.preload = {
  isPreloaded: boolean;         // All data fetched successfully
  isPreloading: boolean;        // Currently fetching
  preloadError: string | null;  // Error message if any
  lastPreloadTime: number | null; // Timestamp of last preload
}
```

## Error Handling

- **Network Errors**: Silently fail, data available for on-demand fetch
- **Invalid Data**: Type-safe via TypeScript
- **Missing Company Context**: Products fetch skipped if no company_id
- **Logout**: Preload state reset, useRef prevents multiple preloads

## Performance Characteristics

- **Initial Load**: ~3 parallel API calls (companies + users + products)
- **Data Access**: O(1) from Redux cache
- **Re-renders**: Minimal - only when data changes or preload status updates
- **Memory**: O(n) where n = total items preloaded

## Migration Guide

### Before (Fetching on Tab Open)
```typescript
useEffect(() => {
  if (selectedCompanyId > 0) {
    loadUsers(selectedCompanyId);
  }
}, [selectedCompanyId, loadUsers]);
```

### After (Using Preloaded Data)
```typescript
const { users, loading } = useUsers();
// Data already available
```

## Testing

Example test for component using global data:
```typescript
import { useGlobalData } from "../hooks/useGlobalData";
import { renderHook } from "@testing-library/react";

describe("useGlobalData", () => {
  it("returns cached global data", () => {
    const { result } = renderHook(() => useGlobalData());
    expect(result.current.companies).toBeDefined();
    expect(Array.isArray(result.current.users)).toBe(true);
  });
});
```

## Troubleshooting

### Data Not Loading
- Check AuthContext - user must be authenticated
- Verify network in browser DevTools
- Check Redux DevTools for preload state

### Duplicate API Calls
- Verify DataPreloader is in component tree
- Check for multiple useGlobalData() calls in same component (use memoization)
- Use Redux DevTools to inspect dispatch history

### Stale Data
- Call `refreshAll()` from useGlobalDataRefresh
- Data auto-updates when models change
- Manual refresh for external data changes

## Future Enhancements

- [ ] Add configurable refresh interval
- [ ] Implement incremental loading strategy
- [ ] Add prefetch for common queries
- [ ] Cache persistence to localStorage
- [ ] Mutation optimistic updates
