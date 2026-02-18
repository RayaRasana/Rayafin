# RR-Accounting: Multi-Tenant Accounting System

A production-grade SQLAlchemy ORM implementation for a multi-tenant SaaS accounting platform with Row-Level Security, financial safety, and comprehensive audit logging.

## Features

### 🏢 Multi-Tenant Architecture
- Company-based isolation with `company_id` field on all operational tables
- Row-Level Security (RLS) ready for PostgreSQL
- Tenant context enforcement via `app.current_company_id` setting

### 💰 Financial Safety
- **Numeric(12,2)** for all monetary fields (prevents floating-point rounding errors)
- Commission snapshots freeze calculations at payment time
- Invoice total preservation when users are deleted (SET NULL relationships)
- Audit trail for compliance and forensic analysis

### 🔐 Role-Based Access Control
- **OWNER**: Full admin access, can lock/unlock invoices, approve commissions
- **ACCOUNTANT**: Create/edit invoices, manage customers
- **SALES**: View own commissions, limited access to sales records

### 📋 Invoice Management
- Status workflow: DRAFT → ISSUED → PAID
- Invoice locking: Only OWNER can edit locked invoices
- Dual user tracking: sold_by_user (sales rep) and created_by_user (accountant)
- Line items with quantity, pricing, and discount support
- Unique invoice numbers per company

### 💼 Commission System
- Automatic snapshot creation when invoice is marked PAID
- Captures invoice total, commission percent, and calculated amount
- Status workflow: PENDING → APPROVED → PAID
- Accurate reporting prevents retroactive calculation changes
- Full audit trail for payroll reconciliation

### 📝 Comprehensive Audit Logging
- Tracks all CRUD operations on financial entities
- Stores old_data (before) and new_data (after) in JSON
- User reference preserved when user is deleted (SET NULL)
- Indexes optimized for compliance queries

### 🛡️ Data Integrity
- CHECK constraints (commission_percent: 0-100)
- UNIQUE constraints (invoice_number per company, customer email per company)
- Foreign key relationships with appropriate CASCADE/SET NULL strategies
- Strategic indexes for query performance

## Database Schema

### Entities

```
Company
├── CompanyUser (user roles per company)
│   └── User (system users)
├── Customer
│   └── Invoice
│       ├── InvoiceItem
│       └── Commission (snapshot)
└── AuditLog
```

### Core Tables

1. **companies** - Tenant isolation boundary
2. **users** - System users (global, not tenant-specific)
3. **company_users** - RBAC junction (user + role + commission% + company)
4. **customers** - Company-specific customers
5. **invoices** - Financial documents
6. **invoice_items** - Line items on invoices
7. **commissions** - Commission snapshots for paid invoices
8. **audit_logs** - Compliance trail

## Installation

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- pip or conda

### Setup

1. Clone the repository:
```bash
cd c:\Users\barba\OneDrive\Documents\GitHub\RR-Accounting
```

2. Install dependencies:
```bash
pip install sqlalchemy psycopg2-binary python-dotenv
```

3. Configure database:
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

4. Create tables:
```bash
python models.py
```

## Usage

### Basic Setup

```python
from models import (
    get_database_url, 
    create_all_tables, 
    get_session,
    Company, User, Invoice, Commission
)

# Initialize database
database_url = get_database_url()
engine = create_all_tables(database_url)
session = get_session(database_url)
```

### Create Company with Users

```python
from models import Company, User, CompanyUser, UserRole
from decimal import Decimal

# Create company
company = Company(name="Acme Corporation")
session.add(company)
session.flush()

# Create users
owner = User(email="owner@acme.com", password_hash="...", full_name="John Owner")
sales = User(email="sales@acme.com", password_hash="...", full_name="Jane Sales")
session.add_all([owner, sales])
session.flush()

# Assign roles
owner_role = CompanyUser(
    company_id=company.id,
    user_id=owner.id,
    role=UserRole.OWNER,
    commission_percent=Decimal('10.00')
)
sales_role = CompanyUser(
    company_id=company.id,
    user_id=sales.id,
    role=UserRole.SALES,
    commission_percent=Decimal('20.00')
)
session.add_all([owner_role, sales_role])
session.commit()
```

### Create Invoice with Items

```python
from models import Customer, Invoice, InvoiceItem, InvoiceStatus
from decimal import Decimal

# Create customer
customer = Customer(
    company_id=company.id,
    name="Big Client Inc.",
    email="client@bigclient.com"
)
session.add(customer)
session.flush()

# Create invoice
invoice = Invoice(
    company_id=company.id,
    customer_id=customer.id,
    invoice_number="INV-2026-001",
    status=InvoiceStatus.DRAFT,
    sold_by_user_id=sales.id,
    created_by_user_id=owner.id,
    total_amount=Decimal('1000.00')
)
session.add(invoice)
session.flush()

# Add line items
item = InvoiceItem(
    invoice_id=invoice.id,
    description="Professional Services",
    quantity=Decimal('10.00'),
    unit_price=Decimal('100.00'),
    discount=Decimal('0.00'),
    total_amount=Decimal('1000.00')
)
session.add(item)
session.commit()
```

### Commission Snapshots

When an invoice is marked as PAID, a Commission record captures the snapshot:

```python
from models import Commission, CommissionStatus
from decimal import Decimal

# Before marking paid
invoice.status = InvoiceStatus.PAID
invoice.paid_at = datetime.utcnow()
session.flush()

# Commission snapshot created (set up event listener)
# commission = Commission(
#     company_id=invoice.company_id,
#     invoice_id=invoice.id,
#     user_id=invoice.sold_by_user_id,
#     base_amount=invoice.total_amount,  # 1000.00
#     percent=Decimal('20.00'),          # from CompanyUser
#     commission_amount=Decimal('200.00'), # calculated
#     status=CommissionStatus.PENDING
# )
```

### Query Examples

```python
# Get company invoices by status
draft_invoices = session.query(Invoice).filter(
    Invoice.company_id == company.id,
    Invoice.status == InvoiceStatus.DRAFT
).all()

# Get pending commissions for a user
user_commissions = session.query(Commission).filter(
    Commission.user_id == sales.id,
    Commission.status == CommissionStatus.PENDING
).all()

# Get audit trail for an invoice
audit_logs = session.query(AuditLog).filter(
    AuditLog.entity_type == "Invoice",
    AuditLog.entity_id == invoice.id
).order_by(AuditLog.created_at.desc()).all()

# Calculate total commissions by status
from sqlalchemy import func
commission_totals = session.query(
    Commission.status,
    func.sum(Commission.commission_amount).label('total')
).filter(
    Commission.company_id == company.id
).group_by(Commission.status).all()
```

## Security Patterns

### 1. Row-Level Security (RLS)

Enable PostgreSQL RLS to enforce company isolation at the database level:

```python
from models import setup_rls_policies

# Setup RLS policies (one-time)
setup_rls_policies(get_database_url())

# Before queries, set company context:
# SET app.current_company_id = '123';
```

**RLS Policy Template:**
```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoice_company_isolation ON invoices
    USING (company_id = current_setting('app.current_company_id')::integer)
    WITH CHECK (company_id = current_setting('app.current_company_id')::integer);
```

### 2. Invoice Locking (RBAC)

Prevent unauthorized edits to locked invoices:

```python
# Application-level enforcement (before UPDATE)
def update_invoice(invoice_id, user_id, company_id, updates):
    invoice = session.query(Invoice).filter_by(id=invoice_id).first()
    
    if invoice.is_locked:
        user_role = session.query(CompanyUser).filter(
            CompanyUser.company_id == company_id,
            CompanyUser.user_id == user_id
        ).first()
        
        if user_role.role != UserRole.OWNER:
            raise PermissionError("Only OWNER can edit locked invoices")
    
    # Apply updates
    session.commit()
```

### 3. Commission Snapshots

Create snapshots when invoices are paid (prevents retroactive changes):

```python
# Database trigger (PostgreSQL) recommended:
CREATE OR REPLACE FUNCTION create_commission_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        INSERT INTO commissions (
            company_id, invoice_id, user_id, 
            base_amount, percent, commission_amount, status
        ) SELECT
            NEW.company_id,
            NEW.id,
            NEW.sold_by_user_id,
            NEW.total_amount,
            COALESCE(cu.commission_percent, 20),
            NEW.total_amount * COALESCE(cu.commission_percent, 20) / 100,
            'pending'
        FROM company_users cu
        WHERE cu.user_id = NEW.sold_by_user_id
        AND cu.company_id = NEW.company_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_invoice_paid AFTER UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION create_commission_snapshot();
```

### 4. Audit Trail

All changes are logged automatically:

```python
from models import AuditLog
import json

# Create audit entry
audit = AuditLog(
    company_id=company.id,
    user_id=current_user.id,
    action="UPDATE",
    entity_type="Invoice",
    entity_id=invoice.id,
    old_data=json.dumps(old_values),
    new_data=json.dumps(new_values)
)
session.add(audit)
session.commit()

# Query audit trail
history = session.query(AuditLog).filter(
    AuditLog.entity_type == "Invoice",
    AuditLog.entity_id == invoice.id
).order_by(AuditLog.created_at.desc()).all()

for log in history:
    print(f"{log.action} by {log.user.full_name}")
    print(f"  Before: {log.old_data}")
    print(f"  After: {log.new_data}")
```

## Financial Safety Notes

### Numeric vs Float

All monetary amounts use `Numeric(12,2)` to prevent rounding errors:

```python
from decimal import Decimal

# ✓ Correct
invoice.total_amount = Decimal('1000.00')
commission = Decimal('200.00')

# ✗ Wrong (floating-point errors)
invoice.total_amount = 1000.00  # Float
commission = 199.99999999999997  # Rounding error
```

### Commission Calculation

Always use Decimal arithmetic for financial calculations:

```python
# Correct formula
commission_amount = base_amount * (percent / Decimal('100'))

# Example
base = Decimal('1000.00')
percent = Decimal('20.00')
commission = base * (percent / Decimal('100'))  # Decimal('200.00')
```

## Environment Variables

### Backend Run & Repo Notes

- Backend code has been reorganized into the `backend` package under `backend/app`.
- To run the FastAPI reference backend locally:

```bash
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

- Integration tests (reference) live under `backend/tests/`. Run the health-check runner:

```bash
python backend/tests/api_test_suite.py
```

Configure via `.env` file:

```
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rr_accounting
```

Or set directly:

```bash
export DB_USER=your_user
export DB_PASSWORD=your_password
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=rr_accounting

python models.py
```

## Testing

Run the integrated test/example:

```bash
python models.py
```

This creates sample data and demonstrates:
- Company and user creation
- Role assignment
- Invoice creation with items
- Audit logging
- Query patterns

## API Reference

### Models

- `Company` - Tenant entity
- `User` - System user
- `CompanyUser` - User-company junction with RBAC
- `Customer` - Customer record
- `Invoice` - Financial document
- `InvoiceItem` - Line item
- `Commission` - Commission snapshot
- `AuditLog` - Change log

### Enums

- `UserRole`: OWNER, ACCOUNTANT, SALES
- `InvoiceStatus`: DRAFT, ISSUED, PAID
- `CommissionStatus`: PENDING, APPROVED, PAID

### Functions

- `get_database_url()` - Generate connection URL from env vars
- `create_all_tables()` - Initialize database schema
- `get_session()` - Create SQLAlchemy session
- `setup_rls_policies()` - Enable PostgreSQL RLS

## Best Practices

1. **Always use Decimal for monetary values**
   ```python
   from decimal import Decimal
   amount = Decimal('100.00')  # Not 100.0
   ```

2. **Filter by company_id in all queries**
   ```python
   session.query(Invoice).filter(
       Invoice.company_id == current_company_id
   )
   ```

3. **Use string values for Enum columns in queries**
   ```python
   session.query(Invoice).filter(
       Invoice.status == InvoiceStatus.PAID
   )
   ```

4. **Preserve user references with SET NULL**
   - Don't CASCADE delete users (preserves audit trail)
   - Use SET NULL to break relationships

5. **Log all financial operations**
   - Create AuditLog entries for invoices, commissions, payments
   - Include old_data and new_data as JSON

6. **Use timestamps for audit**
   ```python
   from datetime import datetime
   invoice.created_at = datetime.utcnow()
   invoice.updated_at = datetime.utcnow()
   invoice.paid_at = datetime.utcnow()
   ```

7. **Enable RLS in production**
   ```python
   setup_rls_policies(DATABASE_URL)
   ```

## Schema Diagram

```
companies
├── id (PK)
├── name
├── created_at
└── updated_at

users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── full_name
├── is_active
├── created_at
└── updated_at

company_users
├── id (PK)
├── company_id (FK) ──→ companies.id
├── user_id (FK) ────→ users.id
├── role (ENUM)
├── commission_percent (NUMERIC, CHECK 0-100)
├── created_at
├── updated_at
└── UC(company_id, user_id)

customers
├── id (PK)
├── company_id (FK) ──→ companies.id
├── name
├── phone
├── email
├── created_at
├── updated_at
└── UC(company_id, email)

invoices
├── id (PK)
├── company_id (FK) ──→ companies.id
├── customer_id (FK) ─→ customers.id
├── invoice_number
├── status (ENUM)
├── sold_by_user_id (FK) ──→ users.id (SET NULL)
├── created_by_user_id (FK) ─→ users.id (SET NULL)
├── total_amount (NUMERIC)
├── is_locked
├── created_at
├── updated_at
├── paid_at
└── UC(company_id, invoice_number)

invoice_items
├── id (PK)
├── invoice_id (FK) ─→ invoices.id
├── description
├── quantity (NUMERIC)
├── unit_price (NUMERIC)
├── discount (NUMERIC)
└── total_amount (NUMERIC)

commissions
├── id (PK)
├── company_id (FK) ──→ companies.id
├── invoice_id (FK) ──→ invoices.id
├── user_id (FK) ────→ users.id (SET NULL)
├── base_amount (NUMERIC)
├── percent (NUMERIC, CHECK 0-100)
├── commission_amount (NUMERIC)
├── status (ENUM)
├── created_at
└── updated_at

audit_logs
├── id (PK)
├── company_id (FK) ──→ companies.id
├── user_id (FK) ────→ users.id (SET NULL)
├── action
├── entity_type
├── entity_id
├── old_data (JSON)
├── new_data (JSON)
└── created_at
```

## Contributing

This is a reference implementation. Feel free to fork and extend for your needs.

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please create an issue in the repository or contact the development team.

---

**Last Updated:** February 17, 2026
**Version:** 1.0.0
