# Frontend Build Configuration

This directory contains the React + TypeScript frontend for the RR Accounting System.

## Quick Start

### Prerequisites
- Node.js 14+ installed
- npm or yarn package manager
- Backend API running at http://127.0.0.1:8000

### Installation & Running

1. **Install dependencies:**
```bash
npm install
```

2. **Configure API URL (Optional):**
   - Edit `.env` file if your backend is on a different URL
   - Default: `http://127.0.0.1:8000/api`

3. **Start development server:**
```bash
npm start
```

The application will automatically open at `http://localhost:3000`

### Full Setup with Backend

If you want to run both frontend and backend together:

```bash
# Terminal 1: Start the backend (in parent directory)
cd ..
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Start the reference backend with Uvicorn:
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2: Start the frontend
cd frontend
npm install
npm start
```

## Available Scripts

- `npm start` - Run development server
- `npm build` - Create production build
- `npm test` - Run unit tests

## Project Structure

### Key Directories

- **src/api/** - API endpoint definitions using Axios
- **src/components/** - React components organized by feature
- **src/store/** - Redux store configuration with slices
- **src/types/** - TypeScript interface definitions
- **src/utils/** - Helper functions (validation, date formatting, Persian translations)

### Component Hierarchy

```
App
├── Layout
│   ├── Navigation
│   └── Routes
│       ├── CompanyList
│       ├── CustomerList
│       ├── UserList
│       ├── InvoiceList
│       └── CommissionList
└── Toast (notifications)
```

## Features Implemented

✅ **Companies** - Full CRUD operations
✅ **Customers** - Full CRUD with company filtering
✅ **Users** - User management with admin roles
✅ **Invoices** - Complete invoice management with line items
✅ **Commissions** - Commission tracking and snapshot creation
✅ **Multi-tenant** - Company-based data isolation
✅ **RTL Layout** - Full Persian/Farsi UI support
✅ **Form Validation** - All inputs validated with error messages
✅ **State Management** - Redux for global app state
✅ **Responsive UI** - Works on desktop and mobile

## Persian (Farsi) Language Features

- All labels, buttons, and messages in Persian
- RTL text alignment throughout the app
- Date formatting as YYYY/MM/DD
- Persian number support
- Proper text direction in forms and tables

## Multi-Tenant Implementation

Every request includes the `company_id`:

1. **Company Selection** - Users select a company to work with
2. **Data Filtering** - Data is automatically filtered by selected company
3. **Automatic Inclusion** - company_id is automatically added to all API requests
4. **Company Context** - Selected company appears in navigation

## Validation Examples

### Invoice Items
- Quantity: Must be > 0
- Unit Price: Must be > 0
- Total: Automatically calculated as `quantity * unit_price - discount`
- Minimum one item required per invoice

### Commission
- Percentage: Must be between 0-100
- Can only create after invoice exists
- Payment date is optional

### General
- All required fields must be filled
- Email format validation
- Phone number basic validation
- Cannot delete without confirmation

## Troubleshooting

### Port 3000 Already in Use
```bash
PORT=3001 npm start
```

### Backend Connection Error
- Check backend is running: `http://127.0.0.1:8000`
- Update REACT_APP_API_URL in .env file
- Ensure CORS is enabled in backend

### Package Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
- Ensure TypeScript is up to date: `npm install -D typescript@latest`
- Check tsconfig.json is present

## Development Workflow

1. **Create new component** in `src/components/[Feature]/`
2. **Define types** in `src/types/index.ts`
3. **Create API calls** in `src/api/[entity].ts`
4. **Add Redux slice** in `src/store/[entity]Slice.ts`
5. **Import in App.tsx** routes
6. **Test with running backend**

## API Integration

All API calls go through Axios instance in `src/api/axios.ts`:

```typescript
import { companyAPI } from "../api/companies";

// Usage in component
const companies = await companyAPI.getAll();
const company = await companyAPI.create({ name: "Test" });
```

## Redux State Management

Access global state with Redux hooks:

```typescript
const dispatch = useDispatch<AppDispatch>();
const items = useSelector((state: RootState) => state.companies.items);

// Dispatch actions
dispatch(setCompanies(data));
```

## Form Implementation Pattern

Each entity has:
1. **Form Component** - Dialog with validation
2. **List Component** - Table with CRUD buttons
3. **API Module** - All endpoint calls
4. **Redux Slice** - State management

## Date Handling

Dates are formatted using utility functions:

```typescript
import { formatDateToPersian, today } from "../utils/dateUtils";

const persianDate = formatDateToPersian(new Date()); // "1402/09/17"
const todayDate = today(); // Gets today in Persian format
```

## Number Formatting

Persian number conversion available:

```typescript
import { toPersianNumber, formatCurrencyPersian } from "../utils/dateUtils";

toPersianNumber(123); // "۱۲۳"
formatCurrencyPersian(1000000); // "۱٬۰۰۰٬۰۰۰"
```

## Next Steps

After setup, you can:

1. **Add Authentication** - Integrate with backend auth API
2. **Extend Features** - Add reports, analytics, exports
3. **Improve UI** - Add more Material-UI components
4. **Performance** - Add pagination and lazy loading
5. **Testing** - Write Jest tests for components

---

For backend API documentation, see the backend README in the parent directory.
