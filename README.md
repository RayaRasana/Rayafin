<div align="center">

# 💰 RR-Accounting

### Multi-Tenant Accounting Platform

*Production-grade FastAPI + SQLAlchemy backend for SaaS accounting with strict tenant isolation, RBAC, and financial correctness*

---

![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-ORM-red?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

[📚 Documentation](docs/) | [🚀 Quick Start](#-quick-start) | [💻 API Guide](docs/API_TEST_GUIDE.md) | [🔧 Deployment](docs/DEPLOYMENT_SUMMARY.md)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation--setup)
- [🏗️ Architecture](#️-system-architecture)
- [🔐 Security](#-security-patterns)
- [💵 Financial Safety](#-financial-safety-notes)
- [📊 Database Schema](#-database-schema)
- [🧪 Testing](#-testing)
- [📖 Documentation](#-documentation)

---

### 🎯 Core Design Goals

RR-Accounting is designed for **backend-first** SaaS accounting workloads where correctness and access control are non-negotiable.

```
✅ Tenant-safe operations        ✅ No floating-point drift
✅ Enforceable RBAC              ✅ Immutable financial history
✅ PostgreSQL RLS ready          ✅ Complete audit trails
```

### 🏢 Multi-Tenant Isolation
- 🔒 `company_id` on all operational entities
- 🎯 Tenant context binding through `app.current_company_id`
- 🛡️ RLS-ready schema and policy model for PostgreSQL
- 🔐 Dual isolation: Application + Database level

### 💎 Financial Safety
- 💰 `Numeric(12,2)` for all monetary values (no float drift!)
- 📸 Snapshot-based commission capture at payment time
- 🔐 Invoice totals preserved when related users are deleted
- 📝 Complete audit trail coverage for financial operations

### 👥 Role-Based Access Control (RBAC)
- 👑 **OWNER**: Full admin control, lock/unlock invoices, approve/pay commissions
- 📊 **ACCOUNTANT**: Create/update invoices, manage customers
- 💼 **SALES**: Limited read access to own sales/commission scope

### 📋 Invoice & Commission Workflows
- 📄 Invoice lifecycle: `DRAFT → ISSUED → PAID`
- 🔒 Locking model for protected edits
- 💵 Commission lifecycle: `PENDING → APPROVED → PAID`
- ⚡ Automatic snapshot creation on paid invoice transition

### 🔍 Auditability & Integrity
- 📚 CRUD audit entries with before/after JSON payloads
- ✅ CHECK/UNIQUE constraints for consistency
- ⚡ Targeted indexes for common read paths and compliance queries

---

## 🚀 Quick Start

Get up and running in 3 steps:

### 1️⃣ Setup Environment
```bash
# Clone the repository
cd c:\Users\barba\OneDrive\Documents\GitHub\RR-Accounting

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 2️⃣ Initialize Database
```bash
# Create database schema
python setup_database.py

# Create owner account
python setup_owner.py
```

### 3️⃣ Start Backend
```bash
# Run the FastAPI server
python run_backend.py

# Or use uvicorn directly
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

🎉 **Done!** Your backend is now running at `http://127.0.0.1:8000`

📚 Check out the [Owner Setup Guide](docs/OWNER_SETUP_GUIDE.md) for more details!

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      🏢 Company                         │
│                    (Tenant Root)                        │
└────┬────────────────────────────────────────────────────┘
     │
     ├──► 👥 CompanyUser (Role + Commission %)
     │         └──► User (Global Identity)
     │
     ├──► 👤 Customer
     │         └──► 📄 Invoice
     │                 ├──► 📋 InvoiceItem
     │                 └──► 💵 Commission (Snapshot)
     │
     └──► 📚 AuditLog (Compliance Trail)
```

### 🎯 Why This Architecture?

This backend intentionally combines application-level authorization with database-level isolation:

| Feature | Benefit |
|---------|---------|
| 🔄 **Dual Isolation Model** | Tenant boundaries enforced in request context (`company_id`) AND PostgreSQL RLS |
| 🎭 **RBAC at Company Scope** | Roles via `company_users` for contextual, multi-tenant safe permissions |
| 💎 **Financial Integrity** | `Numeric(12,2)` + domain constraints + snapshots prevent retroactive drift |
| 🔍 **Operational Traceability** | Audit logs capture before/after state for forensic & compliance workflows |
| 🛡️ **Deletion-Safe Data Model** | `SET NULL` and `CASCADE` preserve financial records and user accountability |

---

## 📦 Installation & Setup

### 📋 Prerequisites
- 🐍 Python 3.8+
- 🐘 PostgreSQL 12+
- 📦 pip or conda

### 🔧 Detailed Setup Steps

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/RR-Accounting.git
cd RR-Accounting
```

#### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

Required packages:
- `fastapi` - Modern web framework
- `sqlalchemy` - Database ORM
- `psycopg2-binary` - PostgreSQL adapter
- `python-dotenv` - Environment management
- `uvicorn` - ASGI server

#### 3. Configure Environment Variables

Create `.env` file from template:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# 🗄️ Database Configuration
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rr_accounting

# 🔐 Security (Optional)
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
```

#### 4. Initialize Database Schema
```bash
python setup_database.py
```

This will:
- ✅ Create all tables
- ✅ Set up relationships
- ✅ Apply constraints
- ✅ Create indexes

#### 5. Create Owner Account
```bash
python setup_owner.py
```

Follow the prompts to create your first admin user!

---

## 🚀 Backend Run

### Start Development Server
```bash
# Using the run script
python run_backend.py

# Or use uvicorn directly
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:
- 🌐 API: `http://127.0.0.1:8000`
- 📖 Interactive Docs: `http://127.0.0.1:8000/docs`
- 📋 Alternative Docs: `http://127.0.0.1:8000/redoc`

### Run API Tests
```bash
python backend/tests/api_test_suite.py
```

---

## 📊 Database Schema

### 🗂️ Core Tables

| Table | Icon | Purpose |
|-------|------|---------|
| `companies` | 🏢 | Tenant boundary (root entity) |
| `users` | 👤 | Global user identity |
| `company_users` | 🎭 | Tenant-role mapping + commission settings |
| `customers` | 👥 | Tenant-scoped customers |
| `invoices` | 📄 | Financial documents |
| `invoice_items` | 📋 | Invoice line items |
| `commissions` | 💵 | Commission snapshots (immutable) |
| `audit_logs` | 📚 | Compliance/event trail |

### 🔍 Entity Details

### 🔍 Entity Details

- 🏢 **`companies`**: Root tenant entity
- 👤 **`users`**: Global identity records; tenant permissions NOT stored here
- 🎭 **`company_users`**: Role + commission settings by company membership
- 👥 **`customers`**: Unique email per company
- 📄 **`invoices`**: Unique invoice number per company, lock flag, paid timestamp
- 📋 **`invoice_items`**: Computed total with DB-level check
- 💵 **`commissions`**: Immutable financial snapshot fields
- 📚 **`audit_logs`**: Operation metadata + before/after payloads

### 🗺️ Detailed Schema Diagram

<details>
<summary>Click to expand full schema</summary>

```text
🏢 companies
├── id (PK)
├── name
├── created_at
└── updated_at

👤 users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── full_name
├── is_active
├── created_at
└── updated_at

🎭 company_users
├── id (PK)
├── company_id (FK) ──→ companies.id
├── user_id (FK) ────→ users.id
├── role (ENUM: OWNER|ACCOUNTANT|SALES)
├── commission_percent (NUMERIC, CHECK 0-100)
├── created_at
├── updated_at
└── UNIQUE(company_id, user_id)

👥 customers
├── id (PK)
├── company_id (FK) ──→ companies.id
├── name
├── phone
├── email
├── created_at
├── updated_at
└── UNIQUE(company_id, email)

📄 invoices
├── id (PK)
├── company_id (FK) ──→ companies.id
├── customer_id (FK) ─→ customers.id
├── invoice_number
├── status (ENUM: DRAFT|ISSUED|PAID)
├── sold_by_user_id (FK) ──→ users.id (SET NULL)
├── created_by_user_id (FK) ─→ users.id (SET NULL)
├── total_amount (NUMERIC)
├── is_locked (BOOLEAN)
├── created_at
├── updated_at
├── paid_at
└── UNIQUE(company_id, invoice_number)

📋 invoice_items
├── id (PK)
├── invoice_id (FK) ─→ invoices.id
├── description
├── quantity (NUMERIC)
├── unit_price (NUMERIC)
├── discount (NUMERIC)
└── total_amount (NUMERIC)

💵 commissions
├── id (PK)
├── company_id (FK) ──→ companies.id
├── invoice_id (FK) ──→ invoices.id
├── user_id (FK) ────→ users.id (SET NULL)
├── base_amount (NUMERIC)
├── percent (NUMERIC, CHECK 0-100)
├── commission_amount (NUMERIC)
├── status (ENUM: PENDING|APPROVED|PAID)
├── created_at
└── updated_at

📚 audit_logs
├── id (PK)
├── company_id (FK) ──→ companies.id
├── user_id (FK) ────→ users.id (SET NULL)
├── action (CREATE|UPDATE|DELETE)
├── entity_type
├── entity_id
├── old_data (JSONB)
├── new_data (JSONB)
└── created_at
```

</details>

---

## 💻 Usage Examples

### 🎬 Basic Bootstrap

```python
from models import get_database_url, create_all_tables, get_session
from models import Company, User, Invoice, Commission

# Initialize database connection
database_url = get_database_url()
engine = create_all_tables(database_url)
session = get_session(database_url)
```

### 🏢 Create Company + Memberships

```python
from decimal import Decimal
from models import Company, User, CompanyUser, UserRole

# Create company
company = Company(name="Acme Corporation")
session.add(company)
session.flush()

# Create users
owner = User(
    email="owner@acme.com",
    password_hash="...",
    full_name="John Owner"
)
sales = User(
    email="sales@acme.com",
    password_hash="...",
    full_name="Jane Sales"
)
session.add_all([owner, sales])
session.flush()

# Assign roles with commission rates
session.add_all([
    CompanyUser(
        company_id=company.id,
        user_id=owner.id,
        role=UserRole.OWNER,
        commission_percent=Decimal("10.00")
    ),
    CompanyUser(
        company_id=company.id,
        user_id=sales.id,
        role=UserRole.SALES,
        commission_percent=Decimal("20.00")
    ),
])
session.commit()
```

### 📄 Create Invoice + Line Items

```python
from decimal import Decimal
from models import Customer, Invoice, InvoiceItem, InvoiceStatus

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
    total_amount=Decimal("1000.00"),
)
session.add(invoice)
session.flush()

# Add invoice item
item = InvoiceItem(
    invoice_id=invoice.id,
    description="Professional Services",
    quantity=Decimal("10.00"),
    unit_price=Decimal("100.00"),
    discount=Decimal("0.00"),
    total_amount=Decimal("1000.00"),
)
session.add(item)
session.commit()
```

### 🔍 Query Patterns

```python
from sqlalchemy import func
from models import Invoice, InvoiceStatus, Commission, CommissionStatus, AuditLog

# Find all draft invoices
draft_invoices = session.query(Invoice).filter(
    Invoice.company_id == company.id,
    Invoice.status == InvoiceStatus.DRAFT
).all()

# Find pending commissions for a user
pending_commissions = session.query(Commission).filter(
    Commission.user_id == sales.id,
    Commission.status == CommissionStatus.PENDING
).all()

# Get audit history for an invoice
invoice_audit = session.query(AuditLog).filter(
    AuditLog.entity_type == "Invoice",
    AuditLog.entity_id == invoice.id
).order_by(AuditLog.created_at.desc()).all()

# Calculate commission totals by status
commission_totals = session.query(
    Commission.status,
    func.sum(Commission.commission_amount).label("total")
).filter(
    Commission.company_id == company.id
).group_by(Commission.status).all()
```

---

## 🔐 Security Patterns

### 🛡️ 1) Row-Level Security (RLS)

Enable PostgreSQL Row-Level Security for database-level tenant isolation:

```python
from models import setup_rls_policies, get_database_url

# Set up RLS policies
setup_rls_policies(get_database_url())

# For each request/session:
# SET app.current_company_id = '123';
```

**RLS Policy Template:**

```sql
-- Enable RLS on table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create isolation policy
CREATE POLICY invoice_company_isolation ON invoices
    USING (company_id = current_setting('app.current_company_id')::integer)
    WITH CHECK (company_id = current_setting('app.current_company_id')::integer);
```

### 🔒 2) Invoice Lock Enforcement (RBAC)

```python
def update_invoice(invoice_id, user_id, company_id, updates):
    invoice = session.query(Invoice).filter_by(id=invoice_id).first()

    # Check if invoice is locked
    if invoice.is_locked:
        user_role = session.query(CompanyUser).filter(
            CompanyUser.company_id == company_id,
            CompanyUser.user_id == user_id
        ).first()
        
        # Only OWNER can edit locked invoices
        if user_role.role != UserRole.OWNER:
            raise PermissionError("🚫 Only OWNER can edit locked invoices")

    # Apply updates
    # ...
    session.commit()
```

### 💵 3) Commission Snapshot on Payment

Automatic commission creation using PostgreSQL trigger:

<details>
<summary>Click to view trigger SQL</summary>

```sql
CREATE OR REPLACE FUNCTION create_commission_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    -- When invoice is marked as paid, create commission snapshot
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        INSERT INTO commissions (
            company_id,
            invoice_id,
            user_id,
            base_amount,
            percent,
            commission_amount,
            status
        )
        SELECT
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

</details>

### 📚 4) Audit Logging

Track all changes with before/after snapshots:

```python
import json
from models import AuditLog

# Create audit entry
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

### 💎 Decimal-Only Money Handling

**Never use floats for money!** Decimals avoid floating-point precision errors.

```python
from decimal import Decimal

# ✅ CORRECT - Use Decimal
invoice.total_amount = Decimal("1000.00")
commission = Decimal("200.00")
result = Decimal("1200.00")

# ❌ WRONG - Never use float for money
invoice.total_amount = 1000.00  # Don't do this!
```

### 🧮 Commission Formula

```python
# Calculate commission amount
commission_amount = base_amount * (percent / Decimal("100"))

# Example
base = Decimal("1000.00")
percent = Decimal("20.00")
commission = base * (percent / Decimal("100"))  # = Decimal("200.00")
```

### 💰 Best Practices

| ✅ Do | ❌ Don't |
|-------|----------|
| Use `Decimal("10.00")` | Use `10.0` or `10.00` |
| Store as `Numeric(12,2)` | Use `FLOAT` or `REAL` |
| Always use `Decimal` math | Mix floats with Decimals |
| Validate before storing | Trust user input |

### 🎯 Why This Matters

```python
# Float precision issues (BAD)
>>> 0.1 + 0.2
0.30000000000000004  # 😱 Wrong!

# Decimal precision (GOOD)
>>> Decimal("0.1") + Decimal("0.2")
Decimal("0.3")  # ✅ Correct!
```

---

## 🧪 Testing

### Run Integrated Test Flow

```bash
# Full model test
python models.py
```

This exercises:
- ✅ Company/user creation
- ✅ Role assignment
- ✅ Invoice and line-item flows
- ✅ Audit and query patterns

### Run API Test Suite

```bash
# Backend API tests
python backend/tests/api_test_suite.py
```

### Available Test Scripts

| Script | Purpose |
|--------|---------|
| 📝 `scripts/test_api_endpoints.py` | Test all API endpoints |
| 🔐 `scripts/rbac_runtime_smoke_test.py` | Test RBAC permissions |
| 🔍 `scripts/verify_admin.py` | Verify admin setup |
| 🗄️ `scripts/databasetest.py` | Database connectivity test |

---

## 🎯 Production Readiness

<div align="center">

✅ **RBAC + Tenant Context** - Enforced in service layer  
✅ **RLS-Compatible Schema** - Database-level isolation  
✅ **Monetary Precision** - `Numeric` + `Decimal` everywhere  
✅ **Immutable Snapshots** - Payroll correctness guaranteed  
✅ **Complete Audit History** - Before/after state tracking  
✅ **Constraint-Backed Integrity** - Indexed query paths  

</div>

---

## 📖 Documentation

### 📚 Available Guides

| Guide | Description |
|-------|-------------|
| 🚀 [Quick Start](docs/QUICK_START.md) | Get started in minutes |
| 👑 [Owner Setup Guide](docs/OWNER_SETUP_GUIDE.md) | Create your owner account |
| 🔧 [Backend Quick Start](docs/BACKEND_QUICK_START.md) | Backend setup details |
| 🧪 [API Testing Guide](docs/API_TEST_GUIDE.md) | Test all endpoints |
| 🚢 [Deployment Summary](docs/DEPLOYMENT_SUMMARY.md) | Deploy to production |
| 📊 [Project Summary](docs/PROJECT_SUMMARY.md) | High-level overview |
| 🔬 [Advanced Topics](docs/ADVANCED.md) | Deep dive into features |

### 🎨 Frontend

| Guide | Description |
|-------|-------------|
| 💻 [Frontend Setup](frontend/SETUP.md) | Setup React frontend |
| 📖 [Implementation Guide](frontend/IMPLEMENTATION_GUIDE.md) | Frontend architecture |

---

## 🛠️ API & Model Reference

### 📦 Models

- 🏢 `Company` - Tenant root entity
- 👤 `User` - Global user identity
- 🎭 `CompanyUser` - Role & commission mapping
- 👥 `Customer` - Company customers
- 📄 `Invoice` - Financial documents
- 📋 `InvoiceItem` - Invoice line items
- 💵 `Commission` - Commission snapshots
- 📚 `AuditLog` - Audit trail entries

### 🎯 Enums

| Enum | Values |
|------|--------|
| `UserRole` | `OWNER` · `ACCOUNTANT` · `SALES` |
| `InvoiceStatus` | `DRAFT` · `ISSUED` · `PAID` |
| `CommissionStatus` | `PENDING` · `APPROVED` · `PAID` |

### ⚙️ Utility Functions

```python
get_database_url()        # Build database connection URL
create_all_tables()       # Initialize all database tables
get_session()             # Get SQLAlchemy session
setup_rls_policies()      # Enable Row-Level Security
```

---

## 🌟 Engineering Best Practices

1. 💰 **Always use `Decimal` for money values**
2. 🏢 **Always scope queries by `company_id`**
3. 🎯 **Use enum types directly in status filters**
4. 🔒 **Use `SET NULL` where auditability matters**
5. 📝 **Log financial changes with before/after payloads**
6. ⏰ **Maintain UTC timestamps for all operations**
7. 🛡️ **Enable and validate RLS policies in production**

---

## 🤝 Contributing

This is a reference implementation intended for extension.  
Fork and adapt to your compliance, tenancy, and operational requirements.

### 💡 How to Contribute

1. 🍴 Fork the repository
2. 🌿 Create a feature branch
3. ✨ Make your changes
4. 🧪 Test thoroughly
5. 📤 Submit a pull request

---

## 📜 License

MIT License — see `LICENSE` file for details.

---

## 💬 Support

Need help? Here's how to get support:

- 🐛 **Bug Reports**: Open an issue with details
- 💡 **Feature Requests**: Suggest enhancements via issues
- 📖 **Documentation**: Check the [docs/](docs/) folder
- 🔧 **Implementation Help**: Open a discussion

---

<div align="center">

### 🌟 Made with ❤️ for Accounting Excellence

**Last Updated:** February 19, 2026 | **Version:** 1.0.0

[⬆️ Back to Top](#-rr-accounting)

</div>
