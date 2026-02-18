# RR Accounting Frontend - Complete Implementation Guide

## 📋 Overview

This is a **complete, production-ready React + TypeScript frontend** for the RR Accounting multi-tenant system.

### ✅ All Requirements Implemented

1. **Full CRUD pages for:**
   - ✅ Company (list, create, edit, delete)
   - ✅ Customer (list, create, edit, delete)
   - ✅ User management with company assignment
   - ✅ Invoice with InvoiceItems management
   - ✅ Commission display per invoice and user

2. **Navigation & Routing:**
   - ✅ React Router v6 with 5 main pages
   - ✅ Navigation bar with menu items
   - ✅ Clean URL structure

3. **API Integration:**
   - ✅ Axios for all HTTP calls
   - ✅ Loading states
   - ✅ Error handling
   - ✅ Success notifications
   - ✅ Auto-refresh after CRUD operations

4. **TypeScript:**
   - ✅ Complete interfaces for all models
   - ✅ Full type safety throughout
   - ✅ Type-safe Redux store
   - ✅ Type-safe component props

5. **Form Validation:**
   - ✅ Required field validation
   - ✅ Email validation
   - ✅ Invoice total calculation: `quantity * unit_price - discount`
   - ✅ Commission percent: 0-100
   - ✅ Positive numbers validation
   - ✅ Inline error messages

6. **Data Management:**
   - ✅ Auto-refresh after create/update/delete
   - ✅ Redux Toolkit for state management
   - ✅ Global store with 5 slices
   - ✅ Selector-based component updates

7. **UI Library:**
   - ✅ Material-UI (MUI) components
   - ✅ Responsive tables
   - ✅ Modal dialogs
   - ✅ Form controls
   - ✅ Icon buttons
   - ✅ Chips for status indicators
   - ✅ Collapse for expandable rows

8. **Invoice Features:**
   - ✅ Status updates (draft, sent, paid, overdue)
   - ✅ Commission snapshot creation
   - ✅ Line items with add/remove
   - ✅ Automatic total calculation
   - ✅ Expandable rows to view items
   - ✅ Invoice date and due date

9. **State Management:**
   - ✅ Redux Toolkit store
   - ✅ Slice-based architecture
   - ✅ Company slice
   - ✅ Customer slice
   - ✅ User slice
   - ✅ Invoice slice
   - ✅ Commission slice

10. **Ready to Run:**
    - ✅ `npm install && npm start`
    - ✅ Production build: `npm run build`
    - ✅ .env file for configuration
    - ✅ All dependencies in package.json

11. **No Mock Data:**
    - ✅ All data from live backend API
    - ✅ No hardcoded values
    - ✅ Dynamic dropdowns from database

12. **Multi-Tenant Support:**
    - ✅ company_id in all requests
    - ✅ Customer filtering by company
    - ✅ Invoice filtering by company
    - ✅ User assignment to companies
    - ✅ Commission association with invoices

13. **Persian (Farsi) UI:**
    - ✅ All labels in Persian
    - ✅ All buttons in Persian
    - ✅ All messages in Persian
    - ✅ RTL layout
    - ✅ Date format: YYYY/MM/DD
    - ✅ Persian digit support
    - ✅ Right-aligned tables

14. **Documentation:**
    - ✅ Complete README
    - ✅ Setup instructions
    - ✅ API endpoint documentation
    - ✅ Component structure
    - ✅ This implementation guide

---

## 🚀 Quick Start

### Installation

```bash
cd frontend
npm install
npm start
```

The app opens at `http://localhost:3000`

### Configuration

Edit `.env`:
```
REACT_APP_API_URL=http://127.0.0.1:8000/api
```

---

## 📁 File Structure

```
frontend/
├── public/
│   └── index.html              # HTML template with Persian meta tags
├── src/
│   ├── api/
│   │   ├── axios.ts           # Axios instance with interceptors
│   │   ├── companies.ts       # Company API calls
│   │   ├── customers.ts       # Customer API calls
│   │   ├── users.ts           # User API calls
│   │   ├── invoices.ts        # Invoice & item API calls
│   │   └── commissions.ts     # Commission API calls
│   ├── types/
│   │   └── index.ts           # All TypeScript interfaces
│   ├── store/
│   │   ├── store.ts           # Redux store configuration
│   │   ├── companySlice.ts    # Company state & actions
│   │   ├── customerSlice.ts   # Customer state & actions
│   │   ├── userSlice.ts       # User state & actions
│   │   ├── invoiceSlice.ts    # Invoice state & actions
│   │   └── commissionSlice.ts # Commission state & actions
│   ├── components/
│   │   ├── Common/
│   │   │   ├── Layout.tsx      # Main layout wrapper
│   │   │   └── Navigation.tsx  # Top navigation bar
│   │   ├── Company/
│   │   │   ├── CompanyList.tsx # Company CRUD list
│   │   │   └── CompanyForm.tsx # Company add/edit dialog
│   │   ├── Customer/
│   │   │   ├── CustomerList.tsx
│   │   │   └── CustomerForm.tsx
│   │   ├── User/
│   │   │   ├── UserList.tsx
│   │   │   └── UserForm.tsx
│   │   ├── Invoice/
│   │   │   ├── InvoiceList.tsx # Expandable invoice table
│   │   │   └── InvoiceForm.tsx # Invoice & items creation
│   │   ├── Commission/
│   │   │   └── CommissionList.tsx # Commission management
│   │   └── Toast/
│   │       └── Toast.tsx       # Notification component
│   ├── utils/
│   │   ├── dateUtils.ts       # Persian date formatting
│   │   ├── validation.ts      # Form validation utilities
│   │   └── persian.ts         # Persian labels & constants
│   ├── App.tsx                # Main app with routes
│   ├── index.tsx              # React entry point
│   └── index.css              # Global RTL styles
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── .env                       # API URL configuration
├── .env.example               # Template .env file
├── README.md                  # User documentation
├── SETUP.md                   # Setup & configuration guide
└── IMPLEMENTATION_GUIDE.md    # This file
```

---

## 🎯 Feature Details

### 1. Companies Management

**File:** `src/components/Company/`

**Features:**
- List all companies in a table
- Create new company with dialog form
- Edit existing company
- Delete company with confirmation
- Fields: name, address, phone, email, tax_id

**API Endpoints:**
```
GET    /api/companies/
GET    /api/companies/{id}/
POST   /api/companies/
PUT    /api/companies/{id}/
DELETE /api/companies/{id}/
```

**Redux State:**
- `store.companies.items` - Array of companies
- `store.companies.selectedCompany` - Currently selected
- `store.companies.loading` - Loading state
- `store.companies.error` - Error message

### 2. Customers Management

**File:** `src/components/Customer/`

**Features:**
- Filter customers by company
- Company selector dropdown
- Create/edit/delete operations
- Fields: name, email, phone, address, company_id

**Multi-Tenant:**
- Auto-filters by selected company
- Company required on creation

**API Endpoints:**
```
GET    /api/customers/?company_id={id}
GET    /api/customers/{id}/
POST   /api/customers/
PUT    /api/customers/{id}/
DELETE /api/customers/{id}/
```

### 3. Users Management

**File:** `src/components/User/`

**Features:**
- Create users with username, email, full_name
- Admin role checkbox
- Company assignment (optional)
- Edit user information
- Delete user with confirmation
- Role display with Chip component

**Fields:**
- username (read-only when editing)
- full_name
- email
- is_admin (boolean)
- company_id (optional)

**API Endpoints:**
```
GET    /api/users/
GET    /api/users/{id}/
POST   /api/users/
PUT    /api/users/{id}/
DELETE /api/users/{id}/
```

### 4. Invoices Management

**File:** `src/components/Invoice/`

**Features:**
- Company & customer selector
- Invoice number and status
- Invoice date and due date
- Multiple line items with dynamic add/remove
- Automatic total calculation
- Expandable rows to view items
- Commission snapshot creation button

**Invoice States:**
- draft (default)
- sent
- paid
- overdue

**Line Items:**
- Description
- Quantity (validated > 0)
- Unit Price (validated > 0)
- Discount (validated >= 0)
- Total = quantity * unit_price - discount
- Add/remove items dynamically

**API Endpoints:**
```
GET    /api/invoices/?company_id={id}
GET    /api/invoices/{id}/
POST   /api/invoices/
PUT    /api/invoices/{id}/
DELETE /api/invoices/{id}/
POST   /api/invoices/{id}/items/
PUT    /api/invoices/{id}/items/{item_id}/
DELETE /api/invoices/{id}/items/{item_id}/
POST   /api/invoices/{id}/create-commission-snapshot/
```

### 5. Commissions Management

**File:** `src/components/Commission/`

**Features:**
- Filter by invoice and user
- Create new commissions
- Edit existing commissions
- Delete commissions
- Commission percent validation (0-100)
- Commission amount tracking
- Payment date tracking
- Total commission sum display

**Fields:**
- invoice_id (required)
- user_id (required)
- commission_percent (0-100)
- commission_amount
- paid_date (optional)

**API Endpoints:**
```
GET    /api/commissions/
GET    /api/commissions/?invoice_id={id}&user_id={id}
GET    /api/commissions/{id}/
POST   /api/commissions/
PUT    /api/commissions/{id}/
DELETE /api/commissions/{id}/
```

---

## 🔧 API Integration

### Axios Instance

```typescript
// src/api/axios.ts
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const axiosInstance = axios.create({ baseURL: API_URL });
```

### API Module Pattern

```typescript
// src/api/companies.ts
export const companyAPI = {
  getAll: async () => { /* ... */ },
  getById: async (id) => { /* ... */ },
  create: async (data) => { /* ... */ },
  update: async (id, data) => { /* ... */ },
  delete: async (id) => { /* ... */ },
};
```

### Usage in Components

```typescript
import { companyAPI } from "../api/companies";

const companies = await companyAPI.getAll();
const newCompany = await companyAPI.create(data);
await companyAPI.update(id, updatedData);
await companyAPI.delete(id);
```

---

## 📦 Redux Store

### Store Structure

```typescript
// src/store/store.ts
export const store = configureStore({
  reducer: {
    companies: companyReducer,
    customers: customerReducer,
    users: userReducer,
    invoices: invoiceReducer,
    commissions: commissionReducer,
  },
});
```

### Slice Pattern

```typescript
// Each slice has:
// - Initial state
// - Reducers for: setItems, addItem, updateItem, deleteItem, setLoading, setError
// - Exported actions for dispatch
// - Default reducer export

const companySlice = createSlice({
  name: "companies",
  initialState: { items: [], loading: false, error: null },
  reducers: {
    setCompanies: (state, action) => { state.items = action.payload; },
    addCompany: (state, action) => { state.items.push(action.payload); },
    updateCompany: (state, action) => { /* update item in array */ },
    deleteCompany: (state, action) => { /* filter out item */ },
    // ...
  },
});
```

### Using Redux in Components

```typescript
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";

export const MyComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((state: RootState) => state.companies.items);
  
  dispatch(setCompanies(data));
  dispatch(addCompany(newItem));
};
```

---

## ✅ Form Validation

### Validation Rules

**Required Fields:**
```typescript
validateRequired(value): boolean
// Checks if value is not null, undefined, or empty
```

**Email Validation:**
```typescript
validateEmail(email): boolean
// Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

**Phone Validation:**
```typescript
validatePhone(phone): boolean
// Requires 7+ characters with digits, spaces, hyphens, plus, parentheses
```

**Invoice Total Calculation:**
```typescript
validateInvoiceTotal(quantity, unitPrice, discount): number
// Returns: quantity * unitPrice - discount
```

**Commission Percent:**
```typescript
validateCommissionPercent(percent): boolean
// Checks: 0 <= percent <= 100
```

**Usage in Components:**
```typescript
const errors = getValidationErrors(formData);
if (Object.keys(errors).length > 0) {
  setErrors(errors);
  return;
}
```

---

## 🌍 Multi-Tenant Implementation

### Company Context Flow

1. **Select Company** - User selects company from dropdown
2. **Set Filter** - Component stores selectedCompanyId state
3. **API Call** - Request includes `?company_id={id}`
4. **Filter Response** - Backend returns only company-specific data
5. **Update Store** - Redux updates with filtered results

### Company-Based Filtering

**Customers:**
```typescript
const customers = await customerAPI.getAll(companyId);
// Request: GET /api/customers/?company_id=1
```

**Invoices:**
```typescript
const invoices = await invoiceAPI.getAll(companyId);
// Request: GET /api/invoices/?company_id=1
```

**User Assignment:**
```typescript
const updated = await userAPI.assignToCompany(userId, companyId);
// Request: POST /api/users/{id}/assign-company/ { company_id: 1 }
```

---

## 🎨 Persian Language Support

### Translations

All UI text in **Persian (Farsi)**:

```typescript
// src/utils/persian.ts
export const PERSIAN_LABELS = {
  save: "ذخیره",
  cancel: "لغو",
  edit: "ویرایش",
  delete: "حذف",
  companies: "شرکت‌ها",
  customers: "مشتریان",
  invoices: "فاکتورها",
  // ... 100+ labels
};
```

### Date Formatting

```typescript
// src/utils/dateUtils.ts
formatDateToPersian("2024-01-15") // "1402/10/25"
today() // Returns today's date in Persian format
```

### RTL Support

```css
/* src/index.css */
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}
```

### Persian Digits

```typescript
toPersianNumber(123) // "۱۲۳"
formatCurrencyPersian(1000000) // "۱٬۰۰۰٬۰۰۰"
```

---

## 🎯 Component Patterns

### CRUD List Component

```typescript
export const CompanyList: React.FC = () => {
  // 1. Redux hooks for state
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((state: RootState) => state.companies.items);
  
  // 2. Local state for dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Company | null>(null);
  
  // 3. Load data on mount
  useEffect(() => { loadItems(); }, []);
  
  // 4. Handle CRUD operations
  const handleAdd = async (data) => { /* create */ };
  const handleEdit = async (data) => { /* update */ };
  const handleDelete = async (id) => { /* delete */ };
  
  // 5. Render table + form dialog
  return (<Table> {/* map items */} </Table>);
};
```

### CRUD Form Component

```typescript
interface FormProps {
  open: boolean;
  item?: Item | null;
  onSave: (data) => void;
  onClose: () => void;
}

export const ItemForm: React.FC<FormProps> = ({ open, item, onSave, onClose }) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  
  const handleSubmit = () => {
    const validationErrors = getValidationErrors(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(formData);
  };
  
  return (
    <Dialog open={open} onClose={onClose}>
      {/* Form fields with error display */}
      {/* Submit button */}
    </Dialog>
  );
};
```

---

## 🔄 Data Flow

### Create Operation Flow

```
User clicks "Add" button
    ↓
Form dialog opens (empty form)
    ↓
User fills form + clicks Save
    ↓
Component validates form
    ↓
API call: POST /api/entities/
    ↓
Backend creates and returns new item
    ↓
Dispatch Redux action: addItem(newItem)
    ↓
Store updates items array
    ↓
Component re-renders with new item
    ↓
Dialog closes
```

### Update Operation Flow

```
User clicks Edit button on row
    ↓
Form dialog opens with item data
    ↓
User modifies fields + clicks Save
    ↓
Component validates form
    ↓
API call: PUT /api/entities/{id}/
    ↓
Backend updates and returns item
    ↓
Dispatch Redux action: updateItem(updatedItem)
    ↓
Store updates item in array
    ↓
Component re-renders
    ↓
Dialog closes
```

### Delete Operation Flow

```
User clicks Delete button
    ↓
Confirmation dialog appears
    ↓
User confirms
    ↓
API call: DELETE /api/entities/{id}/
    ↓
Backend deletes item
    ↓
Dispatch Redux action: deleteItem(id)
    ↓
Store removes item from array
    ↓
Component re-renders without item
```

---

## 📊 Invoice Management Details

### Invoice Creation with Items

```typescript
handleFormSave = async (invoiceData, items) => {
  // 1. Create invoice
  const newInvoice = await invoiceAPI.create(invoiceData);
  
  // 2. Create each item
  for (const item of items) {
    await invoiceAPI.createItem(newInvoice.id, item);
  }
  
  // 3. Fetch complete invoice with items
  const complete = await invoiceAPI.getById(newInvoice.id);
  
  // 4. Update Redux store
  dispatch(addInvoice(complete));
};
```

### Invoice Item Calculations

```typescript
// In form
const calculateTotal = () => {
  return items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unit_price - item.discount;
    return sum + Math.max(0, itemTotal);
  }, 0);
};
```

### Commission Snapshot

```typescript
handleCreateSnapshot = async (invoiceId) => {
  const commissions = await commissionAPI.createSnapshot(invoiceId);
  dispatch(setCommissions(commissions));
};
```

---

## 🚀 Deployment

### Production Build

```bash
npm run build
```

Creates optimized bundle in `build/` directory.

### Environment Variables

Create `.env.production`:
```
REACT_APP_API_URL=https://your-production-api.com/api
```

### Server Configuration

The app is a single-page application. Configure your server to:
1. Serve static files from `build/`
2. Redirect all routes to `index.html`
3. Set cache headers appropriately

### Docker (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🧪 Testing the Application

### Manual Testing Checklist

**Companies:**
- [ ] Create company
- [ ] Edit company
- [ ] Delete company (with confirm)
- [ ] List shows updated data

**Customers:**
- [ ] Select company from dropdown
- [ ] Create customer for company
- [ ] List shows only selected company's customers
- [ ] Delete customer

**Users:**
- [ ] Create user with admin role
- [ ] Create user with regular role
- [ ] Assign user to company
- [ ] Edit user information
- [ ] Delete user

**Invoices:**
- [ ] Create invoice with line items
- [ ] Total calculated correctly
- [ ] Update invoice status
- [ ] View items in expandable row
- [ ] Delete invoice with confirm
- [ ] Create commission snapshot

**Commissions:**
- [ ] Filter by invoice
- [ ] Filter by user
- [ ] Create commission
- [ ] Validate percent 0-100
- [ ] Total showing correctly
- [ ] Delete commission

---

## 🐛 Common Issues & Solutions

### Issue: API Connection Error
**Solution:** Check backend is running at http://127.0.0.1:8000

### Issue: Company dropdown empty
**Solution:** Load companies first on app start

### Issue: Forms not validating
**Solution:** Check validation rules in `utils/validation.ts`

### Issue: Redux state not updating
**Solution:** Ensure dispatch is called with correct action

### Issue: RTL layout broken
**Solution:** Check `dir="rtl"` attributes in components

---

## 📚 Additional Resources

- [Material-UI Documentation](https://mui.com)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)
- [React Router Documentation](https://reactrouter.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Axios Documentation](https://axios-http.com)

---

## 📞 Support

For issues:
1. Check backend API is running
2. Review browser console for errors
3. Check network tab for API responses
4. Verify .env file has correct API URL
5. Ensure backend database has data

---

**Last Updated:** February 17, 2026
**Frontend Version:** 1.0.0
**React Version:** 18.2.0
**TypeScript:** 5.2.2
