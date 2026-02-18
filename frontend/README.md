# RR Accounting System - Frontend

A complete React + TypeScript frontend for the RR Accounting System with multi-tenant support.

## Features

- ✅ Complete CRUD operations for Companies, Customers, Users, Invoices, and Commissions
- ✅ Multi-tenant architecture with company_id support
- ✅ Redux Toolkit for global state management
- ✅ Material-UI (MUI) for responsive interface
- ✅ RTL (Right-to-Left) layout support
- ✅ Full Persian language support
- ✅ Responsive tables with expandable rows
- ✅ Form validation for all inputs
- ✅ Invoice management with line items
- ✅ Commission snapshot creation
- ✅ Date formatting and Persian number support

## Prerequisites

- Node.js 14+
- npm or yarn

## Installation

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

## Configuration

The frontend expects the backend API to be running at `http://127.0.0.1:8000`.

To override this, create a `.env` file in the frontend directory:

```
REACT_APP_API_URL=http://your-api-url:8000/api
```

## Running the Application

Start the development server:

```bash
npm start
```

The application will open at `http://localhost:3000` in your default browser.

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` directory.

## Project Structure

```
frontend/
├── public/               # Static HTML template
├── src/
│   ├── api/             # API call modules
│   │   ├── axios.ts     # Axios instance configuration
│   │   ├── companies.ts
│   │   ├── customers.ts
│   │   ├── users.ts
│   │   ├── invoices.ts
│   │   └── commissions.ts
│   ├── types/           # TypeScript type definitions
│   ├── store/           # Redux store configuration and slices
│   ├── components/      # React components
│   │   ├── Common/      # Shared components (Layout, Navigation, Toast)
│   │   ├── Company/     # Company CRUD components
│   │   ├── Customer/    # Customer CRUD components
│   │   ├── User/        # User management components
│   │   ├── Invoice/     # Invoice CRUD components
│   │   └── Commission/  # Commission display components
│   ├── utils/           # Utility functions
│   │   ├── dateUtils.ts    # Persian date formatting
│   │   ├── validation.ts   # Form validation
│   │   └── persian.ts      # Persian language labels
│   ├── App.tsx          # Main application component
│   ├── index.tsx        # React DOM render
│   └── index.css        # Global styles
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints Used

The frontend communicates with the following backend endpoints:

### Companies
- `GET /api/companies/` - List all companies
- `GET /api/companies/{id}/` - Get company details
- `POST /api/companies/` - Create company
- `PUT /api/companies/{id}/` - Update company
- `DELETE /api/companies/{id}/` - Delete company

### Customers
- `GET /api/customers/?company_id={id}` - List company customers
- `GET /api/customers/{id}/` - Get customer details
- `POST /api/customers/` - Create customer
- `PUT /api/customers/{id}/` - Update customer
- `DELETE /api/customers/{id}/` - Delete customer

### Users
- `GET /api/users/` - List all users
- `GET /api/users/{id}/` - Get user details
- `POST /api/users/` - Create user
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user

### Invoices
- `GET /api/invoices/?company_id={id}` - List company invoices
- `GET /api/invoices/{id}/` - Get invoice details with items
- `POST /api/invoices/` - Create invoice
- `PUT /api/invoices/{id}/` - Update invoice
- `DELETE /api/invoices/{id}/` - Delete invoice
- `POST /api/invoices/{id}/items/` - Create invoice item
- `PUT /api/invoices/{id}/items/{item_id}/` - Update invoice item
- `DELETE /api/invoices/{id}/items/{item_id}/` - Delete invoice item
- `POST /api/invoices/{id}/create-commission-snapshot/` - Create commission snapshot

### Commissions
- `GET /api/commissions/` - List all commissions
- `GET /api/commissions/?invoice_id={id}&user_id={id}` - Filter commissions
- `GET /api/commissions/{id}/` - Get commission details
- `POST /api/commissions/` - Create commission
- `PUT /api/commissions/{id}/` - Update commission
- `DELETE /api/commissions/{id}/` - Delete commission

## Key Components

### Company Management
- Create, read, update, delete companies
- Display company information in responsive tables
- Company selection dropdown in related entities

### Customer Management
- Filter customers by company
- Full CRUD operations
- Contact information management

### User Management
- Create users with admin/regular roles
- Assign users to companies
- Display user roles with visual indicators

### Invoice Management
- Create invoices with multiple line items
- Item-level management (quantity, unit price, discount, total calculation)
- Invoice status tracking (draft, sent, paid, overdue)
- Expandable rows to view invoice items
- Automatic total amount calculation
- Commission snapshot creation

### Commission Management
- View commissions filtered by invoice or user
- Commission percentage and amount tracking
- Payment status tracking with date field
- Commission creation and modification
- Total commission calculation

## Form Validation

All forms include validation for:
- Required fields (marked with Persian label "الزامی است")
- Email format validation
- Phone number validation
- Commission percentage (0-100)
- Positive numbers for quantities and prices
- Invoice total calculation: `quantity * unit_price - discount`

## Multi-Tenant Support

All API requests include the `company_id` parameter:

- Customers are filtered by company
- Invoices are filtered by company
- Users can be assigned to specific companies
- Commissions are associated with invoices which belong to companies

## Language & Localization

All UI elements are in Persian (Farsi):
- Labels, buttons, table headers
- Form placeholders and messages
- Notifications and alerts
- Status indicators

### Date Format

Dates are displayed as `YYYY/MM/DD` format (e.g., `1402/09/17`)

### Number Format

Numbers use Persian (۰-۹) digits with proper formatting.

## State Management

Redux is used for global state management with the following slices:

- `companySlice` - Companies state
- `customerSlice` - Customers state
- `userSlice` - Users state
- `invoiceSlice` - Invoices state
- `commissionSlice` - Commissions state

Each slice manages:
- `items` - Array of entities
- `selectedEntity` - Currently selected entity
- `loading` - Loading state
- `error` - Error message

## Styling

- Material-UI theming
- RTL support with proper text alignment
- Responsive design for mobile and desktop
- Color coding for invoice statuses
- Hover effects on interactive elements

## Error Handling

- API error messages displayed to users
- Form validation errors shown inline
- Network error handling
- Confirmation dialogs for destructive operations

## Future Enhancements

- Authentication/Login system
- User session management
- Report generation
- Invoice PDF export
- Advanced filtering and search
- Data pagination for large datasets
- Batch operations
- Audit logging
- Performance optimization with infinite scroll

## Troubleshooting

### API Connection Issues
- Ensure backend is running at `http://127.0.0.1:8000`
- Check CORS configuration on backend
- Verify network connectivity

### Port Conflicts
If port 3000 is in use, use:
```bash
PORT=3001 npm start
```

### Missing Data
- Verify backend database has data
- Check that company_id matches between related entities
- Ensure API endpoints are accessible

## Support

For issues or questions, check the backend API documentation and ensure it's running correctly.

## License

MIT
