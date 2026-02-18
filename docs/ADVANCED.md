# Advanced Usage Guide - RR-Accounting System

Comprehensive guide for implementing security patterns, audit logging, and commission calculations in a production environment.

## Table of Contents
1. [Invoice Locking Pattern](#invoice-locking-pattern)
2. [Commission Snapshot Creation](#commission-snapshot-creation)
3. [Audit Trail Implementation](#audit-trail-implementation)
4. [Row-Level Security](#row-level-security)
5. [Financial Calculations](#financial-calculations)
6. [Performance Optimization](#performance-optimization)

---

## Invoice Locking Pattern

Implement role-based access control for locked invoices.

### Pattern 1: Application-Level Enforcement

```python
from models import (
    get_database_url, get_session, Invoice,
    CompanyUser, UserRole, InvoiceStatus
)
from typing import Optional

class InvoiceManager:
    """Manages invoice operations with RBAC enforcement."""
    
    def __init__(self, database_url: str):
        self.session = get_session(database_url)
    
    def get_user_role(self, user_id: int, company_id: int) -> Optional[UserRole]:
        """Get user's role in a company."""
        company_user = self.session.query(CompanyUser).filter(
            CompanyUser.user_id == user_id,
            CompanyUser.company_id == company_id
        ).first()
        return company_user.role if company_user else None
    
    def update_invoice(
        self, 
        invoice_id: int, 
        user_id: int, 
        company_id: int,
        updates: dict
    ) -> Invoice:
        """
        Update invoice with permission checks.
        
        Permission Rules:
        - OWNER: Can always edit
        - ACCOUNTANT: Can edit only if is_locked=False
        - SALES: Cannot edit invoices
        
        Args:
            invoice_id: Invoice to update
            user_id: User making the change
            company_id: Company context
            updates: Fields to update (status, total_amount, etc.)
        
        Returns:
            Updated invoice
            
        Raises:
            PermissionError: If user lacks authorization
        """
        invoice = self.session.query(Invoice).filter_by(id=invoice_id).first()
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        
        if invoice.company_id != company_id:
            raise PermissionError("Invoice belongs to different company")
        
        user_role = self.get_user_role(user_id, company_id)
        if not user_role:
            raise PermissionError("User not assigned to company")
        
        # Permission check
        if invoice.is_locked and user_role != UserRole.OWNER:
            raise PermissionError(
                f"Invoice is locked. Only OWNER can edit. "
                f"Current role: {user_role.value}"
            )
        
        if user_role == UserRole.SALES:
            raise PermissionError("SALES role cannot edit invoices")
        
        # Prevent status changes when locked
        if invoice.is_locked and 'status' in updates:
            raise PermissionError("Cannot change status of locked invoice")
        
        # Apply updates
        for key, value in updates.items():
            if hasattr(invoice, key):
                setattr(invoice, key, value)
        
        # Create audit log
        self._create_audit_log(
            invoice, user_id, company_id, "UPDATE", updates
        )
        
        self.session.commit()
        return invoice
    
    def lock_invoice(
        self, 
        invoice_id: int, 
        user_id: int, 
        company_id: int
    ) -> Invoice:
        """
        Lock invoice (only OWNER can do this).
        Once locked, only OWNER can edit.
        """
        if self.get_user_role(user_id, company_id) != UserRole.OWNER:
            raise PermissionError("Only OWNER can lock invoices")
        
        invoice = self.session.query(Invoice).filter_by(id=invoice_id).first()
        invoice.is_locked = True
        
        self._create_audit_log(
            invoice, user_id, company_id, "LOCK", {"is_locked": True}
        )
        
        self.session.commit()
        return invoice
    
    def _create_audit_log(
        self, 
        invoice: Invoice, 
        user_id: int, 
        company_id: int,
        action: str, 
        changes: dict
    ):
        """Create audit log entry."""
        from models import AuditLog
        import json
        
        audit = AuditLog(
            company_id=company_id,
            user_id=user_id,
            action=action,
            entity_type="Invoice",
            entity_id=invoice.id,
            new_data=json.dumps(changes)
        )
        self.session.add(audit)

# Usage
invoice_mgr = InvoiceManager(get_database_url())

try:
    # Locked invoice - ACCOUNTANT cannot edit
    invoice_mgr.update_invoice(
        invoice_id=1,
        user_id=2,  # ACCOUNTANT
        company_id=1,
        updates={"status": "issued"}
    )
except PermissionError as e:
    print(f"Access denied: {e}")

# Locked invoice - OWNER can edit
result = invoice_mgr.update_invoice(
    invoice_id=1,
    user_id=1,  # OWNER
    company_id=1,
    updates={"status": "issued"}
)
print(f"Invoice updated: {result.status}")
```

### Pattern 2: Database-Level Enforcement (PostgreSQL)

```python
def setup_invoice_locking_policy(database_url: str):
    """
    Set up PostgreSQL row security policy for invoice locking.
    This provides database-level enforcement in addition to application checks.
    """
    from sqlalchemy import text, create_engine
    
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        # Create function to check user role
        check_role_fn = """
        CREATE OR REPLACE FUNCTION check_invoice_edit_permission()
        RETURNS BOOLEAN AS $$
        DECLARE
            v_user_role user_role;
            v_is_locked BOOLEAN;
        BEGIN
            -- Get current invoice's locked status
            SELECT is_locked INTO v_is_locked FROM invoices 
            WHERE id = current_setting('app.current_invoice_id')::integer;
            
            -- If locked, check if user is OWNER
            IF v_is_locked THEN
                SELECT role INTO v_user_role FROM company_users
                WHERE user_id = current_setting('app.current_user_id')::integer
                AND company_id = current_setting('app.current_company_id')::integer;
                
                RETURN v_user_role = 'owner';
            END IF;
            
            RETURN TRUE;
        END;
        $$ LANGUAGE plpgsql;
        """
        
        # Create policy
        policy = """
        CREATE POLICY invoice_edit_permission ON invoices
        FOR UPDATE
        USING (check_invoice_edit_permission());
        """
        
        conn.execute(text(check_role_fn))
        conn.execute(text(policy))
        conn.commit()
        print("✓ Invoice locking policy installed")

```

---

## Commission Snapshot Creation

Automatically create commission snapshots when invoices are paid.

### Pattern 1: SQLAlchemy Event Listener

```python
from sqlalchemy import event
from sqlalchemy.orm import object_session
from models import Invoice, Commission, CommissionStatus, CompanyUser, InvoiceStatus
from decimal import Decimal

@event.listens_for(Invoice, 'before_update')
def create_commission_on_paid(mapper, connection, target):
    """
    SQLAlchemy event listener: Create commission snapshot when invoice is marked PAID.
    
    This is called before any invoice UPDATE on the database.
    """
    session = object_session(target)
    
    # Detect status change to PAID
    from sqlalchemy.orm.attributes import get_history
    history = get_history(target, 'status')
    old_status = history.deleted[0] if history.deleted else None
    new_status = target.status
    
    # If transitioning to PAID, create commission snapshot
    if new_status == InvoiceStatus.PAID and old_status != InvoiceStatus.PAID:
        # Get user's commission percentage from company_users
        company_user = session.query(CompanyUser).filter(
            CompanyUser.user_id == target.sold_by_user_id,
            CompanyUser.company_id == target.company_id
        ).first()
        
        if company_user and target.sold_by_user_id:
            percent = Decimal(str(company_user.commission_percent))
            base_amount = target.total_amount
            commission_amount = base_amount * (percent / Decimal('100'))
            
            # Create commission snapshot
            commission = Commission(
                company_id=target.company_id,
                invoice_id=target.id,
                user_id=target.sold_by_user_id,
                base_amount=base_amount,
                percent=percent,
                commission_amount=commission_amount,
                status=CommissionStatus.PENDING
            )
            
            session.add(commission)
            print(f"✓ Commission snapshot created: ${commission_amount}")

# Test in code
session = get_session(get_database_url())
invoice = session.query(Invoice).filter_by(id=1).first()
invoice.status = InvoiceStatus.PAID
session.flush()  # Listener triggers here
session.commit()
```

### Pattern 2: Database Trigger (Recommended for Production)

```python
def setup_commission_trigger(database_url: str):
    """
    Set up PostgreSQL trigger for commission snapshot creation.
    This is more reliable than application-level event listeners.
    
    Advantages:
    - Direct SQL updates trigger commission creation
    - Works even if application bypasses ORM
    - Database-enforced consistency
    """
    from sqlalchemy import text, create_engine
    
    engine = create_engine(database_url)
    
    trigger_function = """
    CREATE OR REPLACE FUNCTION create_commission_on_invoice_paid()
    RETURNS TRIGGER AS $$
    DECLARE
        v_commission_percent NUMERIC;
        v_commission_amount NUMERIC;
    BEGIN
        -- Only process when status changes to 'paid'
        IF NEW.status = 'paid' AND 
           (OLD.status IS NULL OR OLD.status != 'paid') AND
           NEW.sold_by_user_id IS NOT NULL THEN
            
            -- Get commission percentage from company_users
            SELECT commission_percent INTO v_commission_percent
            FROM company_users
            WHERE user_id = NEW.sold_by_user_id
            AND company_id = NEW.company_id;
            
            -- Use default if not found
            v_commission_percent := COALESCE(v_commission_percent, 20.0);
            
            -- Calculate commission amount
            v_commission_amount := NEW.total_amount * 
                                  (v_commission_percent / 100);
            
            -- Create commission snapshot
            INSERT INTO commissions (
                company_id,
                invoice_id,
                user_id,
                base_amount,
                percent,
                commission_amount,
                status,
                created_at
            ) VALUES (
                NEW.company_id,
                NEW.id,
                NEW.sold_by_user_id,
                NEW.total_amount,
                v_commission_percent,
                v_commission_amount,
                'pending',
                NOW()
            );
            
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """
    
    create_trigger = """
    DROP TRIGGER IF EXISTS tr_create_commission_on_paid ON invoices;
    
    CREATE TRIGGER tr_create_commission_on_paid
    AFTER UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION create_commission_on_invoice_paid();
    """
    
    with engine.connect() as conn:
        conn.execute(text(trigger_function))
        conn.execute(text(create_trigger))
        conn.commit()
        print("✓ Commission trigger installed")

setup_commission_trigger(get_database_url())
```

---

## Audit Trail Implementation

Track all changes with detailed audit logs.

### Audit Logger Class

```python
from models import AuditLog
from datetime import datetime
import json
from typing import Any, Dict

class AuditLogger:
    """Comprehensive audit logging system."""
    
    def __init__(self, database_url: str):
        self.session = get_session(database_url)
    
    def log_create(
        self, 
        company_id: int,
        user_id: int,
        entity_type: str,
        entity_id: int,
        data: Dict[str, Any]
    ) -> AuditLog:
        """Log entity creation."""
        audit = AuditLog(
            company_id=company_id,
            user_id=user_id,
            action="CREATE",
            entity_type=entity_type,
            entity_id=entity_id,
            new_data=json.dumps(self._serialize(data), default=str)
        )
        self.session.add(audit)
        self.session.commit()
        return audit
    
    def log_update(
        self,
        company_id: int,
        user_id: int,
        entity_type: str,
        entity_id: int,
        old_data: Dict[str, Any],
        new_data: Dict[str, Any]
    ) -> AuditLog:
        """Log entity update with before/after."""
        audit = AuditLog(
            company_id=company_id,
            user_id=user_id,
            action="UPDATE",
            entity_type=entity_type,
            entity_id=entity_id,
            old_data=json.dumps(self._serialize(old_data), default=str),
            new_data=json.dumps(self._serialize(new_data), default=str)
        )
        self.session.add(audit)
        self.session.commit()
        return audit
    
    def log_delete(
        self,
        company_id: int,
        user_id: int,
        entity_type: str,
        entity_id: int,
        data: Dict[str, Any]
    ) -> AuditLog:
        """Log entity deletion."""
        audit = AuditLog(
            company_id=company_id,
            user_id=user_id,
            action="DELETE",
            entity_type=entity_type,
            entity_id=entity_id,
            old_data=json.dumps(self._serialize(data), default=str)
        )
        self.session.add(audit)
        self.session.commit()
        return audit
    
    def get_entity_history(
        self,
        entity_type: str,
        entity_id: int,
        limit: int = 100
    ) -> list:
        """Get all changes to an entity."""
        logs = self.session.query(AuditLog).filter(
            AuditLog.entity_type == entity_type,
            AuditLog.entity_id == entity_id
        ).order_by(
            AuditLog.created_at.desc()
        ).limit(limit).all()
        
        return logs
    
    def get_user_actions(
        self,
        user_id: int,
        company_id: int,
        limit: int = 100
    ) -> list:
        """Get all actions by a user."""
        logs = self.session.query(AuditLog).filter(
            AuditLog.user_id == user_id,
            AuditLog.company_id == company_id
        ).order_by(
            AuditLog.created_at.desc()
        ).limit(limit).all()
        
        return logs
    
    def generate_compliance_report(
        self,
        company_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Generate compliance report of all changes."""
        logs = self.session.query(AuditLog).filter(
            AuditLog.company_id == company_id,
            AuditLog.created_at >= start_date,
            AuditLog.created_at <= end_date
        ).all()
        
        report = {
            "company_id": company_id,
            "period": f"{start_date.date()} to {end_date.date()}",
            "total_changes": len(logs),
            "changes_by_type": {},
            "changes_by_action": {},
            "changes_by_user": {},
            "logs": []
        }
        
        for log in logs:
            # Count by entity type
            entity = log.entity_type
            report["changes_by_type"][entity] = \
                report["changes_by_type"].get(entity, 0) + 1
            
            # Count by action
            action = log.action
            report["changes_by_action"][action] = \
                report["changes_by_action"].get(action, 0) + 1
            
            # Count by user
            user_name = log.user.full_name if log.user else "System"
            report["changes_by_user"][user_name] = \
                report["changes_by_user"].get(user_name, 0) + 1
            
            # Add log detail
            report["logs"].append({
                "timestamp": log.created_at.isoformat(),
                "user": user_name,
                "action": log.action,
                "entity": f"{log.entity_type}:{log.entity_id}"
            })
        
        return report
    
    @staticmethod
    def _serialize(data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert special types to JSON-serializable formats."""
        from decimal import Decimal
        from datetime import datetime, date
        
        serialized = {}
        for key, value in data.items():
            if isinstance(value, (Decimal, datetime, date)):
                serialized[key] = str(value)
            elif isinstance(value, dict):
                serialized[key] = AuditLogger._serialize(value)
            else:
                serialized[key] = value
        return serialized

# Usage
logger = AuditLogger(get_database_url())

# Log invoice creation
logger.log_create(
    company_id=1,
    user_id=1,
    entity_type="Invoice",
    entity_id=123,
    data={
        "invoice_number": "INV-2026-001",
        "total_amount": "1000.00",
        "status": "draft"
    }
)

# Get entity history
history = logger.get_entity_history("Invoice", 123)
for log in history:
    print(f"{log.created_at} - {log.action} by {log.user.full_name}")

# Generate compliance report
from datetime import datetime, timedelta
report = logger.generate_compliance_report(
    company_id=1,
    start_date=datetime.now() - timedelta(days=30),
    end_date=datetime.now()
)
print(json.dumps(report, indent=2))
```

---

## Row-Level Security

Implement RLS for database-level multi-tenant isolation.

### Setup and Examples

```python
def enable_rls_with_functions(database_url: str):
    """
    Complete RLS setup with user context management.
    
    Process:
    1. Create context-setting functions
    2. Enable RLS on all tables
    3. Create isolation policies
    4. Grant appropriate permissions
    """
    from sqlalchemy import text, create_engine
    
    engine = create_engine(database_url)
    
    statements = [
        # 1. Create session variables
        "SET app.current_company_id = '0';",
        "SET app.current_user_id = '0';",
        
        # 2. Enable RLS on all tables
        "ALTER TABLE companies ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE users ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE customers ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;",
        
        # 3. Create policies - Company level
        """
        CREATE POLICY company_isolation ON companies
        USING (id = current_setting('app.current_company_id')::integer);
        """,
        
        """
        CREATE POLICY company_isolation_insert ON companies
        WITH CHECK (id = current_setting('app.current_company_id')::integer);
        """,
        
        # 4. Create policies - Customer level
        """
        CREATE POLICY customer_isolation ON customers
        USING (company_id = current_setting('app.current_company_id')::integer)
        WITH CHECK (company_id = current_setting('app.current_company_id')::integer);
        """,
        
        # 5. Create policies - Invoice level
        """
        CREATE POLICY invoice_isolation ON invoices
        USING (company_id = current_setting('app.current_company_id')::integer)
        WITH CHECK (company_id = current_setting('app.current_company_id')::integer);
        """,
        
        # 6. Create policies - Invoice Items (through invoice)
        """
        CREATE POLICY invoice_item_isolation ON invoice_items
        USING (invoice_id IN (
            SELECT id FROM invoices
            WHERE company_id = current_setting('app.current_company_id')::integer
        ))
        WITH CHECK (invoice_id IN (
            SELECT id FROM invoices
            WHERE company_id = current_setting('app.current_company_id')::integer
        ));
        """,
        
        # 7. Create policies - Commission level
        """
        CREATE POLICY commission_isolation ON commissions
        USING (company_id = current_setting('app.current_company_id')::integer)
        WITH CHECK (company_id = current_setting('app.current_company_id')::integer);
        """,
        
        # 8. Create policies - Audit logs
        """
        CREATE POLICY audit_isolation ON audit_logs
        USING (company_id = current_setting('app.current_company_id')::integer)
        WITH CHECK (company_id = current_setting('app.current_company_id')::integer);
        """,
```

### Context Manager

```python
from contextlib import contextmanager

@contextmanager
def company_context(database_url: str, company_id: int, user_id: int):
    """
    Context manager to set RLS context.
    
    Usage:
        with company_context(database_url, company_id=1, user_id=100):
            # All queries within this block are filtered by company_id=1
            invoices = session.query(Invoice).all()
            # Returns only invoices where company_id=1
    """
    from sqlalchemy import text, create_engine
    
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        # Set context
        conn.execute(text(f"SET app.current_company_id = '{company_id}';"))
        conn.execute(text(f"SET app.current_user_id = '{user_id}';"))
        
        try:
            yield conn
        finally:
            # Reset context
            conn.execute(text("SET app.current_company_id = '0';"))
            conn.execute(text("SET app.current_user_id = '0';"))

# Usage
with company_context(get_database_url(), company_id=1, user_id=100):
    session = get_session(get_database_url())
    invoices = session.query(Invoice).all()
    # Only invoices from company 1 are returned
```

---

## Financial Calculations

Implement precise financial calculations using Decimal.

### Commission Calculator

```python
from decimal import Decimal, ROUND_HALF_UP

class CommissionCalculator:
    """Accurate commission calculations using Decimal."""
    
    @staticmethod
    def calculate_commission(
        base_amount: Decimal,
        commission_percent: Decimal,
        tax_percent: Decimal = Decimal('0')
    ) -> Dict[str, Decimal]:
        """
        Calculate commission with precision.
        
        Formula:
            commission = base_amount * (commission_percent / 100)
            tax = commission * (tax_percent / 100)
            net_commission = commission - tax
        """
        # Ensure Decimal types
        base = Decimal(str(base_amount))
        percent = Decimal(str(commission_percent))
        tax = Decimal(str(tax_percent))
        
        # Validate inputs
        if base < 0:
            raise ValueError("Base amount cannot be negative")
        if percent < 0 or percent > 100:
            raise ValueError("Commission percent must be 0-100")
        if tax < 0 or tax > 100:
            raise ValueError("Tax percent must be 0-100")
        
        # Calculate
        commission = base * (percent / Decimal('100'))
        commission = commission.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        tax_amount = commission * (tax / Decimal('100'))
        tax_amount = tax_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        net_commission = commission - tax_amount
        net_commission = net_commission.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        return {
            "base_amount": base,
            "commission_percent": percent,
            "commission_amount": commission,
            "tax_percent": tax,
            "tax_amount": tax_amount,
            "net_commission": net_commission
        }
    
    @staticmethod
    def batch_commission_summary(
        commissions_data: list
    ) -> Dict[str, Decimal]:
        """
        Aggregate multiple commissions.
        
        Args:
            commissions_data: List of {amount, percent} dicts
        
        Returns:
            Aggregated totals
        """
        total_base = Decimal('0')
        total_commission = Decimal('0')
        total_tax = Decimal('0')
        total_net = Decimal('0')
        
        for item in commissions_data:
            calc = CommissionCalculator.calculate_commission(
                item['amount'],
                item['percent'],
                item.get('tax_percent', Decimal('0'))
            )
            
            total_base += calc['base_amount']
            total_commission += calc['commission_amount']
            total_tax += calc['tax_amount']
            total_net += calc['net_commission']
        
        return {
            "total_base_amount": total_base,
            "total_commission": total_commission,
            "total_tax": total_tax,
            "total_net_commission": total_net,
            "average_commission_percent": (
                (total_commission / total_base * 100).quantize(Decimal('0.01'))
                if total_base > 0 else Decimal('0')
            )
        }

# Usage
from decimal import Decimal

invoice_total = Decimal('1000.00')
commission_percent = Decimal('20.00')

result = CommissionCalculator.calculate_commission(invoice_total, commission_percent)
print(f"Commission: ${result['commission_amount']}")

# Wrong way (floating point)
# commission = 1000.00 * 0.20  # Result: 200.0 (might be 199.99999... due to float errors)

# Right way (Decimal)
# commission = Decimal('1000.00') * (Decimal('20.00') / Decimal('100'))
# Result: Decimal('200.00') (exact)
```

---

## Performance Optimization

### Query Optimization

```python
from sqlalchemy.orm import joinedload, selectinload, containeager
from sqlalchemy import and_

class OptimizedQueries:
    """Optimized query patterns for the accounting system."""
    
    @staticmethod
    def get_invoice_with_details(session, invoice_id: int):
        """
        Get invoice with all relationships loaded efficiently.
        
        Without optimization: 5+ database queries (N+1 problem)
        With optimization: 1 database query with joins
        """
        invoice = session.query(Invoice).filter_by(id=invoice_id).options(
            joinedload(Invoice.customer),
            joinedload(Invoice.created_by_user),
            joinedload(Invoice.sold_by_user),
            selectinload(Invoice.items),  # Use selectinload for collections
            selectinload(Invoice.commissions)
        ).first()
        return invoice
    
    @staticmethod
    def get_company_invoices_dashboard(session, company_id: int):
        """Get dashboard data for company invoices."""
        from sqlalchemy import func
        
        invoices_by_status = session.query(
            Invoice.status,
            func.count(Invoice.id).label('count'),
            func.sum(Invoice.total_amount).label('total_amount')
        ).filter(
            Invoice.company_id == company_id
        ).group_by(
            Invoice.status
        ).all()
        
        return {
            status.value: {
                "count": count,
                "total": str(total_amount)
            }
            for status, count, total_amount in invoices_by_status
        }
    
    @staticmethod
    def get_pending_commissions_for_user(session, user_id: int, company_id: int):
        """Get pending commissions for a specific user."""
        from decimal import Decimal
        from sqlalchemy import func
        
        result = session.query(
            Commission,
            func.sum(Commission.commission_amount).label('total')
        ).filter(
            and_(
                Commission.user_id == user_id,
                Commission.company_id == company_id,
                Commission.status == CommissionStatus.PENDING
            )
        ).all()
        
        return result

# Usage with batch operations
def batch_import_invoices(session, company_id: int, invoice_data: list):
    """Efficiently import multiple invoices."""
    invoices = []
    items = []
    
    for inv_data in invoice_data:
        invoice = Invoice(
            company_id=company_id,
            customer_id=inv_data['customer_id'],
            invoice_number=inv_data['number'],
            status=InvoiceStatus.DRAFT
        )
        invoices.append(invoice)
        session.add(invoice)
        session.flush()  # Get the ID
        
        for item_data in inv_data['items']:
            item = InvoiceItem(
                invoice_id=invoice.id,
                description=item_data['desc'],
                quantity=Decimal(item_data['qty']),
                unit_price=Decimal(item_data['price']),
                total_amount=Decimal(item_data['total'])
            )
            items.append(item)
    
    # Batch insert all at once
    session.add_all(items)
    session.commit()  # Only 1 database round-trip
    
    return invoices
```

---

## Production Checklist

- [ ] Enable RLS on all multi-tenant tables
- [ ] Set up audit triggers for all financial tables
- [ ] Implement commission snapshot trigger
- [ ] Configure connection pooling
- [ ] Set up backups (daily recommended)
- [ ] Enable SSL/TLS for database connections
- [ ] Create read-only replica for analytics
- [ ] Set up query logging and monitoring
- [ ] Test failover and recovery procedures
- [ ] Document audit log retention policies
- [ ] Implement alerting for suspicious patterns
- [ ] Regular security audits of RLS policies

---

For additional questions, see [README.md](README.md) and [QUICKSTART.md](QUICKSTART.md).
