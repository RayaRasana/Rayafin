# RR-Accounting: Multi-Tenant Accounting Backend

Production-grade FastAPI + SQLAlchemy backend for a multi-tenant accounting SaaS platform with strict tenant isolation, RBAC enforcement, financial correctness, and auditability.

---

## Overview

RR-Accounting is designed for **backend-first** SaaS accounting workloads where correctness and access control are non-negotiable.

Core design goals:

- Tenant-safe operations across all business entities
- Deterministic financial calculations (no floating-point drift)
- Explicit, enforceable RBAC boundaries
- Immutable financial history via snapshots and audit logs
- PostgreSQL-ready with Row-Level Security (RLS) patterns

---

## Why This Architecture

This backend intentionally combines application-level authorization with database-level isolation:

- **Dual isolation model**  
  Tenant boundaries are enforced in request context (`company_id`) and can be reinforced in PostgreSQL via RLS policies.
- **RBAC at company scope**  
  Roles are attached through `company_users`, so permissions are contextual and multi-tenant safe.
- **Financial integrity by type system + constraints**  
  Monetary fields use `Numeric(12,2)`, domain constraints validate percentages/ranges, and snapshots prevent retroactive drift.
- **Operational traceability**  
  Audit logs capture before/after state transitions for forensic and compliance workflows.
- **Deletion-safe data model**  
  `SET NULL` and `CASCADE` are used intentionally to preserve financial records and user accountability where required.

---

## ✨ Key Capabilities

### Multi-Tenant Isolation
- `company_id` on all operational entities
- Tenant context binding through `app.current_company_id`
- RLS-ready schema and policy model for PostgreSQL

### Financial Safety
- `Numeric(12,2)` for all monetary values
- Snapshot-based commission capture at payment time
- Invoice totals preserved when related users are deleted
- Audit trail coverage for financial operations

### RBAC
- **OWNER**: full administrative control, lock/unlock invoices, approve/pay commissions
- **ACCOUNTANT**: create/update invoices, manage customers
- **SALES**: limited read access to own sales/commission scope

### Invoice & Commission Workflows
- Invoice status lifecycle: **DRAFT → ISSUED → PAID**
- Locking model for protected edits
- Commission lifecycle: **PENDING → APPROVED → PAID**
- Snapshot creation on paid invoice transition

### Auditability & Integrity
- CRUD audit entries with before/after JSON payloads
- CHECK/UNIQUE constraints for consistency
- Targeted indexes for common read paths and compliance queries

---

## 🏗️ System Architecture

```text
Company
├── CompanyUser (role + commission% per user/company)
│   └── User (global identity)
├── Customer
│   └── Invoice
│       ├── InvoiceItem
│       └── Commission (snapshot)
└── AuditLog
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|---|---|
| `companies` | Tenant boundary |
| `users` | Global user identity |
| `company_users` | Tenant-role mapping + commission settings |
| `customers` | Tenant-scoped customers |
| `invoices` | Financial documents |
| `invoice_items` | Invoice line items |
| `commissions` | Commission snapshots |
| `audit_logs` | Compliance/event trail |

### Entity Notes

- **`companies`**: root tenant entity
- **`users`**: global identity records; tenant permissions are not stored here
- **`company_users`**: role + commission settings by company membership
- **`customers`**: unique email per company
- **`invoices`**: unique invoice number per company, lock flag, paid timestamp
- **`invoice_items`**: computed total with DB-level check
- **`commissions`**: immutable financial snapshot fields
- **`audit_logs`**: operation metadata + before/after payloads

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- `pip` or `conda`

### Setup Steps

1. Clone and enter repository:
```bash
cd c:\Users\barba\OneDrive\Documents\GitHub\RR-Accounting
```

2. Install dependencies:
```bash
pip install sqlalchemy psycopg2-binary python-dotenv
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with PostgreSQL credentials
```

4. Initialize schema:
```bash
python models.py
```

---

## 🚀 Backend Run

Backend code is organized under `backend/app`.

```bash
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Reference API test suite:

```bash
python backend/tests/api_test_suite.py
```

---

## Environment Configuration

`.env` example:

```env
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rr_accounting
```

Or export directly:

```bash
export DB_USER=your_user
export DB_PASSWORD=your_password
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=rr_accounting
```

---

## Usage

### Basic Bootstrap

```python
from models import get_database_url, create_all_tables, get_session
from models import Company, User, Invoice, Commission

database_url = get_database_url()
engine = create_all_tables(database_url)
session = get_session(database_url)
```

### Create Company + Memberships

```python
from decimal import Decimal
from models import Company, User, CompanyUser, UserRole

company = Company(name="Acme Corporation")
session.add(company); session.flush()

owner = User(email="owner@acme.com", password_hash="...", full_name="John Owner")
sales = User(email="sales@acme.com", password_hash="...", full_name="Jane Sales")
session.add_all([owner, sales]); session.flush()

session.add_all([
    CompanyUser(company_id=company.id, user_id=owner.id, role=UserRole.OWNER, commission_percent=Decimal("10.00")),
    CompanyUser(company_id=company.id, user_id=sales.id, role=UserRole.SALES, commission_percent=Decimal("20.00")),
])
session.commit()
```

### Create Invoice + Item

```python
from decimal import Decimal
from models import Customer, Invoice, InvoiceItem, InvoiceStatus

customer = Customer(company_id=company.id, name="Big Client Inc.", email="client@bigclient.com")
session.add(customer); session.flush()

invoice = Invoice(
    company_id=company.id,
    customer_id=customer.id,
    invoice_number="INV-2026-001",
    status=InvoiceStatus.DRAFT,
    sold_by_user_id=sales.id,
    created_by_user_id=owner.id,
    total_amount=Decimal("1000.00"),
)
session.add(invoice); session.flush()

item = InvoiceItem(
    invoice_id=invoice.id,
    description="Professional Services",
    quantity=Decimal("10.00"),
    unit_price=Decimal("100.00"),
    discount=Decimal("0.00"),
    total_amount=Decimal("1000.00"),
)
session.add(item); session.commit()
```

### Query Patterns

```python
from sqlalchemy import func
from models import Invoice, InvoiceStatus, Commission, CommissionStatus, AuditLog

draft_invoices = session.query(Invoice).filter(
    Invoice.company_id == company.id,
    Invoice.status == InvoiceStatus.DRAFT
).all()

pending_commissions = session.query(Commission).filter(
    Commission.user_id == sales.id,
    Commission.status == CommissionStatus.PENDING
).all()

invoice_audit = session.query(AuditLog).filter(
    AuditLog.entity_type == "Invoice",
    AuditLog.entity_id == invoice.id
).order_by(AuditLog.created_at.desc()).all()

commission_totals = session.query(
    Commission.status,
    func.sum(Commission.commission_amount).label("total")
).filter(
    Commission.company_id == company.id
).group_by(Commission.status).all()
```

---

## 🔐 Security Patterns

### 1) Row-Level Security (RLS)

```python
from models import setup_rls_policies, get_database_url

setup_rls_policies(get_database_url())
# For each request/session: SET app.current_company_id = '123';
```

RLS policy template:

```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoice_company_isolation ON invoices
    USING (company_id = current_setting('app.current_company_id')::integer)
    WITH CHECK (company_id = current_setting('app.current_company_id')::integer);
```

### 2) Invoice Lock Enforcement (RBAC)

```python
def update_invoice(invoice_id, user_id, company_id, updates):
    invoice = session.query(Invoice).filter_by(id=invoice_id).first()

    if invoice.is_locked:
        user_role = session.query(CompanyUser).filter(
            CompanyUser.company_id == company_id,
            CompanyUser.user_id == user_id
        ).first()
        if user_role.role != UserRole.OWNER:
            raise PermissionError("Only OWNER can edit locked invoices")

    session.commit()
```

### 3) Commission Snapshot on Payment

```sql
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

### 4) Audit Logging

```python
import json
from models import AuditLog

audit = AuditLog(
    company_id=company.id,
    user_id=current_user.id,
    action="UPDATE",
    entity_type="Invoice",
    entity_id=invoice.id,
    old_data=json.dumps(old_values),
    new_data=json.dumps(new_values),
)
session.add(audit)
session.commit()
```

---

## 💵 Financial Safety Notes

### Decimal-Only Money Handling

```python
from decimal import Decimal

# Correct
invoice.total_amount = Decimal("1000.00")
commission = Decimal("200.00")

# Avoid float-based money math
# invoice.total_amount = 1000.00
```

### Commission Formula

```python
commission_amount = base_amount * (percent / Decimal("100"))

base = Decimal("1000.00")
percent = Decimal("20.00")
commission = base * (percent / Decimal("100"))  # Decimal("200.00")
```

---

## Production Readiness

- RBAC + tenant context enforced in service layer
- RLS-compatible schema for DB-level isolation
- Monetary precision with `Numeric` + `Decimal`
- Immutable commission snapshots for payroll correctness
- Comprehensive audit history (before/after payloads)
- Constraint-backed integrity + indexed query paths

---

## Testing

Run integrated test/demo flow:

```bash
python models.py
```

This exercises:
- Company/user creation
- Role assignment
- Invoice and line-item flows
- Audit and query patterns

---

## API & Model Reference

### Models
- `Company`
- `User`
- `CompanyUser`
- `Customer`
- `Invoice`
- `InvoiceItem`
- `Commission`
- `AuditLog`

### Enums
- `UserRole`: `OWNER`, `ACCOUNTANT`, `SALES`
- `InvoiceStatus`: `DRAFT`, `ISSUED`, `PAID`
- `CommissionStatus`: `PENDING`, `APPROVED`, `PAID`

### Utility Functions
- `get_database_url()`
- `create_all_tables()`
- `get_session()`
- `setup_rls_policies()`

---

## Engineering Best Practices

1. Use `Decimal` for all money values.
2. Always scope business queries by `company_id`.
3. Use enum types directly in status filters.
4. Preserve references with `SET NULL` where auditability matters.
5. Log financial mutations with before/after payloads.
6. Maintain UTC timestamps for all write paths.
7. Enable and validate RLS policies in production.

---

## Schema Diagram (Detailed)

```text
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

---

## Contributing

This is a reference implementation intended for extension.  
Fork and adapt to your compliance, tenancy, and operational requirements.

## License

MIT License — see `LICENSE`.

## Support

Open an issue in the repository for bugs, architecture questions, or implementation help.

---

**Last Updated:** February 18, 2026  
**Version:** 1.0.0
