# Quick Start Guide - RR-Accounting System

Get up and running with the multi-tenant accounting system in 5 minutes.

## Prerequisites

- Python 3.8+
- PostgreSQL 12+ running locally or on a server
- pip (Python package manager)

## Step 1: Install Dependencies

```bash
cd c:\Users\barba\OneDrive\Documents\GitHub\RR-Accounting
pip install -r requirements.txt
```

This installs:
- `sqlalchemy` - ORM framework
- `psycopg2-binary` - PostgreSQL driver
- `python-dotenv` - Environment variable management

## Step 2: Configure Database

Create a `.env` file with your PostgreSQL credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rr_accounting
```

Make sure PostgreSQL is running and the database exists:
```sql
createdb rr_accounting
```

## Step 3: Create Tables

Run the models script to create all tables:

```bash
python models.py
```

You should see:
```
Database URL: postgresql://postgres:****@localhost:5432/rr_accounting
=== Creating Tables ===
✓ All tables created successfully
=== Creating Sample Data ===
✓ Created company: Acme Corporation (ID: 1)
✓ Created users: owner@acme.com, sales@acme.com
...
```

## Step 4: Verify Installation

Check that tables were created:

```sql
-- Connect to your database
psql -U postgres -d rr_accounting

-- List all tables
\dt

-- You should see these tables:
-- - companies
-- - users
-- - company_users
-- - customers
-- - invoices
-- - invoice_items
-- - commissions
-- - audit_logs
```

## Basic Usage Examples

### Create a Company

```python
from models import get_database_url, get_session, Company

database_url = get_database_url()
session = get_session(database_url)

company = Company(name="My Company Inc.")
session.add(company)
session.commit()

print(f"Created company: {company.name} (ID: {company.id})")
session.close()
```

### Create Users and Assign Roles

```python
from models import (
    get_database_url, get_session, User, CompanyUser,
    UserRole
)
from decimal import Decimal

database_url = get_database_url()
session = get_session(database_url)

# Create users
owner = User(
    email="owner@mycompany.com",
    password_hash="hashed_password",
    full_name="John Owner",
    is_active=True
)
session.add(owner)
session.flush()

# Assign to company
company_user = CompanyUser(
    company_id=1,  # Your company ID
    user_id=owner.id,
    role=UserRole.OWNER,
    commission_percent=Decimal('10.00')
)
session.add(company_user)
session.commit()

print(f"User {owner.email} added as OWNER")
session.close()
```

### Create Invoice

```python
from models import (
    get_database_url, get_session, Invoice,
    InvoiceItem, InvoiceStatus
)
from decimal import Decimal

database_url = get_database_url()
session = get_session(database_url)

# Get company and customer IDs
company_id = 1
customer_id = 1
user_id = 1

# Create invoice
invoice = Invoice(
    company_id=company_id,
    customer_id=customer_id,
    invoice_number="INV-2026-001",
    status=InvoiceStatus.DRAFT,
    created_by_user_id=user_id,
    total_amount=Decimal('1500.00')
)
session.add(invoice)
session.flush()

# Add line items
item = InvoiceItem(
    invoice_id=invoice.id,
    description="Web Development Services",
    quantity=Decimal('5.00'),
    unit_price=Decimal('300.00'),
    discount=Decimal('0.00'),
    total_amount=Decimal('1500.00')
)
session.add(item)
session.commit()

print(f"Invoice {invoice.invoice_number} created")
session.close()
```

### Query Invoices

```python
from models import get_database_url, get_session, Invoice, InvoiceStatus

database_url = get_database_url()
session = get_session(database_url)

# Get all draft invoices for a company
draft_invoices = session.query(Invoice).filter(
    Invoice.company_id == 1,
    Invoice.status == InvoiceStatus.DRAFT
).all()

print(f"Found {len(draft_invoices)} draft invoices")
for inv in draft_invoices:
    print(f"  - {inv.invoice_number}: ${inv.total_amount}")

session.close()
```

## Common Tasks

### Mark Invoice as Paid

```python
from models import get_database_url, get_session, Invoice, InvoiceStatus
from datetime import datetime

database_url = get_database_url()
session = get_session(database_url)

invoice = session.query(Invoice).filter_by(id=1).first()
invoice.status = InvoiceStatus.PAID
invoice.paid_at = datetime.utcnow()
session.commit()

print(f"Invoice {invoice.invoice_number} marked as PAID")
session.close()
```

### Calculate Commission for User

```python
from models import get_database_url, get_session, Commission, CommissionStatus
from sqlalchemy import func

database_url = get_database_url()
session = get_session(database_url)

# Total pending commissions for user
total = session.query(func.sum(Commission.commission_amount)).filter(
    Commission.user_id == 1,
    Commission.status == CommissionStatus.PENDING
).scalar()

print(f"Pending commissions: ${total}")
session.close()
```

### View Audit Trail

```python
from models import get_database_url, get_session, AuditLog

database_url = get_database_url()
session = get_session(database_url)

# Get all changes to an invoice
logs = session.query(AuditLog).filter(
    AuditLog.entity_type == "Invoice",
    AuditLog.entity_id == 1
).order_by(AuditLog.created_at.desc()).all()

for log in logs:
    user = log.user.full_name if log.user else "System"
    print(f"{log.created_at} - {log.action} by {user}")
    if log.old_data:
        print(f"  Before: {log.old_data}")
    if log.new_data:
        print(f"  After: {log.new_data}")

session.close()
```

## Enable Row-Level Security (RLS) - Optional but Recommended

RLS provides database-level multi-tenant isolation:

```python
from models import get_database_url, setup_rls_policies

database_url = get_database_url()
setup_rls_policies(database_url)

print("RLS policies enabled")
```

This enables RLS on all multi-tenant tables and creates policies.

**Before each query, set company context:**

```bash
psql -U postgres -d rr_accounting
SET app.current_company_id = '1';
SELECT * FROM invoices;  -- Only returns company 1 invoices
```

## Troubleshooting

### Error: "database does not exist"

Create the database:
```bash
createdb rr_accounting
```

### Error: "could not connect to server"

Verify PostgreSQL is running:
```bash
psql -U postgres -c "SELECT version();"
```

### Error: "password authentication failed"

Check credentials in `.env` file match your PostgreSQL setup:
```bash
psql -U postgres -h localhost -p 5432 -d rr_accounting
```

### Error: "FATAL: remaining connection slots reserved"

Reduce connection pool or check for connection leaks:
```python
from models import create_engine
engine = create_engine(
    database_url,
    pool_size=5,
    max_overflow=10
)
```

### Tables not created

Ensure `created_at` and `updated_at` timestamps are being set:
```python
from sqlalchemy.orm import object_session
session = object_session(invoice)
session.flush()
```

## Next Steps

1. **Read the full documentation**: See [README.md](README.md)
2. **Review the schema**: See [schema.sql](schema.sql)
3. **Explore the models**: Open [models.py](models.py)
4. **Run production setup**: Configure RLS and audit triggers
5. **Build your API**: Use FastAPI, Flask, or Django with these models

## Architecture Overview

```
Your Application
        ↓
SQLAlchemy ORM (models.py)
        ↓
PostgreSQL Database (production-ready)
        ├── Multi-tenant isolation (company_id)
        ├── Row-Level Security (RLS) [optional]
        ├── Audit logging (AuditLog table)
        ├── Financial safety (Numeric types)
        └── Role-based access control (RBAC)
```

## Security Checklist

- [ ] Change default passwords in `.env`
- [ ] Configure PostgreSQL user permissions
- [ ] Enable RLS in production
- [ ] Set up audit logging triggers
- [ ] Implement rate limiting in API
- [ ] Use HTTPS/SSL in production
- [ ] Hash passwords with bcrypt, not plain text
- [ ] Validate input on all API endpoints
- [ ] Regular database backups
- [ ] Monitor audit logs for suspicious activity

## Performance Tips

1. **Indexes**: Key fields are already indexed (company_id, status, created_at, etc.)
2. **Batch Operations**: Insert multiple records at once
   ```python
   session.add_all([invoice1, invoice2, invoice3])
   session.commit()
   ```
3. **Use `.scalar()` for single values**:
   ```python
   count = session.query(func.count(Invoice.id)).filter(...).scalar()
   ```
4. **Connection Pooling**:
   ```python
   engine = create_engine(url, pool_size=10, max_overflow=20)
   ```
5. **Query Optimization**:
   ```python
   invoices = session.query(Invoice).filter(...).options(
       joinedload(Invoice.items), 
       joinedload(Invoice.customer)
   ).all()
   ```

## Further Reading

- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Multi-Tenancy](https://owasp.org/www-community/attacks/SaaS_Multi_Tenancy)
- [Decimal vs Float in Finance](https://www.postgresql.org/docs/current/datatype-numeric.html)

## Support

For issues or questions:
1. Check [README.md](README.md) for detailed documentation
2. Review [schema.sql](schema.sql) for database structure
3. See [models.py](models.py) for implementation details
4. Check error messages and server logs

---

**You're all set!** Start building your accounting application. 🚀
