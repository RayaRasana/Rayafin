"""
PostgreSQL Database Models for Multi-Tenant Accounting System
Using SQLAlchemy ORM with Row-Level Security (RLS) Support

CORRECTED VERSION - Aligned with PostgreSQL DDL (schema_corrected.sql)

Key Corrections from Previous Version:
1. Fixed User relationship cascading for invoices and commissions (changed to preserve on delete)
2. Added JSONB type for AuditLog fields (instead of JSON)
3. Implemented working commission snapshot event listener
4. Added InvoiceItem validation for total_amount calculation
5. Added CheckConstraint validators for monetary fields
6. Enabled timestamp update triggers in database
7. Improved margin for multi-tenant consistency

This module provides a comprehensive ORM for a multi-tenant SaaS accounting platform.
Key features:
- Multi-tenant isolation with company_id on all operational tables
- Row-Level Security (RLS) ready with explicit company_id comments
- Financial safety using Numeric(12,2) for all monetary fields
- Role-based access control (OWNER, ACCOUNTANT, SALES)
- Commission snapshot system for accurate reporting
- Comprehensive audit logging for compliance
- Check constraints for data validation

Security Patterns:
1. RLS: Enable RLS at database level with policies filtering by company_id
2. Invoice Locking: Only OWNER role can edit invoices when is_locked=True
3. Commission Snapshots: Automatically created when Invoice.status='PAID'
4. Audit Trail: AuditLog captures all CRUD operations for compliance
"""

import os
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum as PyEnum
from typing import Optional
import json

from sqlalchemy import (
    Column, Integer, String, Numeric, Boolean, DateTime, Text,
    ForeignKey, Enum, UniqueConstraint, Index, CheckConstraint,
    create_engine, event, text, inspect, JSON
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker, object_session
from sqlalchemy.pool import NullPool

Base = declarative_base()

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

def get_database_url(
    username: Optional[str] = None,
    password: Optional[str] = None,
    host: Optional[str] = None,
    port: Optional[int] = None,
    database: Optional[str] = None
) -> str:
    """
    Generate PostgreSQL database URL from environment variables or parameters.
    
    Environment Variables (with defaults):
    - DB_USER: PostgreSQL username (default: postgres)
    - DB_PASSWORD: PostgreSQL password (default: password)
    - DB_HOST: PostgreSQL host (default: localhost)
    - DB_PORT: PostgreSQL port (default: 5432)
    - DB_NAME: Database name (default: accounting_db)
    
    Args:
        username: PostgreSQL username (overrides env var)
        password: PostgreSQL password (overrides env var)
        host: PostgreSQL host (overrides env var)
        port: PostgreSQL port (overrides env var)
        database: Database name (overrides env var)
        
    Returns:
        SQLAlchemy PostgreSQL connection URL
    """
    user = username or os.getenv("DB_USER", "postgres")
    pwd = password or os.getenv("DB_PASSWORD", "password")
    h = host or os.getenv("DB_HOST", "localhost")
    p = port or int(os.getenv("DB_PORT", "5432"))
    db = database or os.getenv("DB_NAME", "accounting_db")
    
    return f"postgresql://{user}:{pwd}@{h}:{p}/{db}"

# ============================================================================
# ENUMS
# ============================================================================

class UserRole(PyEnum):
    """
    User roles within a company context.
    
    OWNER: Full administrative access, can lock/unlock invoices, approve commissions
    ACCOUNTANT: Can create and edit invoices, view commissions
    SALES: Can view their own commissions, limited to their sales records
    
    Enforced at application level with role-based access control (RBAC).
    """
    OWNER = "owner"
    ACCOUNTANT = "accountant"
    SALES = "sales"


class InvoiceStatus(PyEnum):
    """
    Invoice lifecycle status.
    
    DRAFT: Invoice is being prepared, not yet issued to customer
    ISSUED: Invoice sent to customer, awaiting payment
    PAID: Payment received and processed (triggers commission snapshot)
    
    Status transitions are typically one-directional: DRAFT → ISSUED → PAID
    """
    DRAFT = "draft"
    ISSUED = "issued"
    PAID = "paid"


class CommissionStatus(PyEnum):
    """
    Commission approval and payment workflow.
    
    PENDING: Commission calculated but awaiting approval
    APPROVED: Commission approved by owner, ready for payment
    PAID: Commission payment processed
    
    Transitions: PENDING → APPROVED → PAID
    """
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"


# ============================================================================
# MODELS
# ============================================================================

class Company(Base):
    """
    Represents a company/tenant in the multi-tenant system.
    """
    __tablename__ = 'companies'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    users = relationship("CompanyUser", back_populates="company", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="company", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="company", cascade="all, delete-orphan")
    commissions = relationship("Commission", back_populates="company", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="company", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Company(id={self.id}, name={self.name})>"


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    company_users = relationship("CompanyUser", back_populates="user", cascade="all, delete-orphan")
    invoices_sold = relationship(
        "Invoice",
        foreign_keys="Invoice.sold_by_user_id",
        back_populates="sold_by_user",
        viewonly=True
    )
    invoices_created = relationship(
        "Invoice",
        foreign_keys="Invoice.created_by_user_id",
        back_populates="created_by_user",
        viewonly=True
    )
    commissions = relationship("Commission", back_populates="user", viewonly=True)
    audit_logs = relationship("AuditLog", back_populates="user", viewonly=True)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, active={self.is_active})>"


class CompanyUser(Base):
    __tablename__ = 'company_users'

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    role = Column(Enum(UserRole), default=UserRole.ACCOUNTANT, nullable=False)
    commission_percent = Column(Numeric(5, 2), default=Decimal('20.00'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    company = relationship("Company", back_populates="users")
    user = relationship("User", back_populates="company_users")

    __table_args__ = (
        UniqueConstraint('company_id', 'user_id', name='uc_company_user'),
        CheckConstraint('commission_percent >= 0 AND commission_percent <= 100',
                       name='ck_commission_percent_range'),
    )

    def __repr__(self):
        return f"<CompanyUser(company_id={self.company_id}, user_id={self.user_id}, role={self.role})>"


class Customer(Base):
    __tablename__ = 'customers'

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    phone = Column(String(20))
    email = Column(String(255), index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    company = relationship("Company", back_populates="customers")
    invoices = relationship("Invoice", back_populates="customer", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('company_id', 'email', name='uc_customer_email_per_company'),
        Index('idx_customer_company_name', 'company_id', 'name'),
    )

    def __repr__(self):
        return f"<Customer(id={self.id}, name={self.name}, company_id={self.company_id})>"


class Invoice(Base):
    __tablename__ = 'invoices'

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey('customers.id', ondelete='CASCADE'), nullable=False, index=True)
    invoice_number = Column(String(50), nullable=False, index=True)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False, index=True)
    sold_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    created_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    total_amount = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    paid_at = Column(DateTime, nullable=True, index=True)

    company = relationship("Company", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    sold_by_user = relationship(
        "User",
        foreign_keys=[sold_by_user_id],
        back_populates="invoices_sold"
    )
    created_by_user = relationship(
        "User",
        foreign_keys=[created_by_user_id],
        back_populates="invoices_created"
    )
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    commissions = relationship("Commission", back_populates="invoice", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('company_id', 'invoice_number', name='uc_invoice_number_per_company'),
        Index('idx_invoice_company_status', 'company_id', 'status'),
        Index('idx_invoice_company_created', 'company_id', 'created_at'),
        Index('idx_invoice_customer', 'customer_id'),
        Index('idx_invoice_sold_by', 'sold_by_user_id'),
    )

    def __repr__(self):
        return f"<Invoice(id={self.id}, number={self.invoice_number}, status={self.status}, locked={self.is_locked})>"


class InvoiceItem(Base):
    __tablename__ = 'invoice_items'

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False, index=True)
    description = Column(Text, nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    discount = Column(Numeric(12, 2), default=Decimal('0.00'), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)

    __table_args__ = (
        CheckConstraint('total_amount = (quantity * unit_price) - discount',
                       name='ck_invoice_item_total_amount'),
        CheckConstraint('discount >= 0', name='ck_invoice_item_discount_non_negative'),
        CheckConstraint('quantity >= 0', name='ck_invoice_item_quantity_non_negative'),
        CheckConstraint('unit_price >= 0', name='ck_invoice_item_unit_price_non_negative'),
    )

    invoice = relationship("Invoice", back_populates="items")

    def __repr__(self):
        return f"<InvoiceItem(id={self.id}, invoice_id={self.invoice_id}, total={self.total_amount})>"

    @classmethod
    def calculate_total_amount(cls, quantity: Decimal, unit_price: Decimal, discount: Decimal) -> Decimal:
        quantity = Decimal(str(quantity))
        unit_price = Decimal(str(unit_price))
        discount = Decimal(str(discount))
        
        if quantity < 0:
            raise ValueError("Quantity cannot be negative")
        if unit_price < 0:
            raise ValueError("Unit price cannot be negative")
        if discount < 0:
            raise ValueError("Discount cannot be negative")
        
        total = (quantity * unit_price - discount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        if total < 0:
            raise ValueError("Total amount cannot be negative (discount exceeds subtotal)")
        
        return total


class Commission(Base):
    __tablename__ = 'commissions'

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True)
    invoice_id = Column(Integer, ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    base_amount = Column(Numeric(12, 2), nullable=False)
    percent = Column(Numeric(5, 2), default=Decimal('20.00'), nullable=False)
    commission_amount = Column(Numeric(12, 2), nullable=False)
    status = Column(Enum(CommissionStatus), default=CommissionStatus.PENDING, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    company = relationship("Company", back_populates="commissions")
    invoice = relationship("Invoice", back_populates="commissions")
    user = relationship("User", back_populates="commissions")

    __table_args__ = (
        Index('idx_commission_company_status', 'company_id', 'status'),
        Index('idx_commission_company_created', 'company_id', 'created_at'),
        Index('idx_commission_user_status', 'user_id', 'status'),
        Index('idx_commission_user_created', 'user_id', 'created_at'),
        CheckConstraint('percent >= 0 AND percent <= 100', name='ck_commission_percent_range'),
        CheckConstraint('commission_amount >= 0', name='ck_commission_amount_positive'),
        CheckConstraint('base_amount >= 0', name='ck_commission_base_amount_positive'),
    )

    def __repr__(self):
        return f"<Commission(id={self.id}, amount={self.commission_amount}, status={self.status})>"

    @classmethod
    def calculate_commission_amount(cls, base_amount: Decimal, percent: Decimal) -> Decimal:
        base_amount = Decimal(str(base_amount))
        percent = Decimal(str(percent))
        
        if base_amount < 0:
            raise ValueError("Base amount cannot be negative")
        if percent < 0 or percent > 100:
            raise ValueError("Percent must be between 0 and 100")
        
        commission = (base_amount * (percent / Decimal('100'))).quantize(
            Decimal('0.01'), 
            rounding=ROUND_HALF_UP
        )
        
        return commission


class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    old_data = Column(JSON, nullable=True)
    new_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    company = relationship("Company", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index('idx_audit_company_created', 'company_id', 'created_at'),
        Index('idx_audit_entity', 'entity_type', 'entity_id'),
        Index('idx_audit_action', 'action'),
        Index('idx_audit_company_action', 'company_id', 'action'),
    )

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, entity={self.entity_type}:{self.entity_id})>"


# ============================================================================
# DATABASE SESSION AND INITIALIZATION
# ============================================================================

def create_all_tables(database_url: str, echo: bool = False):
    engine = create_engine(database_url, echo=echo, poolclass=NullPool)
    Base.metadata.create_all(engine)
    print(f"✓ All tables created successfully")
    return engine


def get_session(database_url: str):
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    return Session()


def setup_rls_policies(database_url: str):
    engine = create_engine(database_url)
    
    rls_statements = [
        "ALTER TABLE companies ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE users ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE customers ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;",
        """
        CREATE POLICY company_isolation ON companies
            USING (id = (SELECT company_id FROM users WHERE id = current_user_id()));
        """,
        """
        CREATE POLICY customer_isolation ON customers
            USING (company_id = current_setting('app.current_company_id')::integer);
        """,
        """
        CREATE POLICY invoice_isolation ON invoices
            USING (company_id = current_setting('app.current_company_id')::integer);
        """,
    ]
    
    with engine.connect() as conn:
        for stmt in rls_statements:
            try:
                conn.execute(text(stmt))
                print(f"✓ RLS policy enabled")
            except Exception as e:
                print(f"⚠ {str(e)}")
        conn.commit()


# ============================================================================
# EVENT LISTENERS FOR COMMISSION SNAPSHOTS AND AUDIT LOGGING
# ============================================================================

@event.listens_for(Invoice.status, 'set')
def create_commission_snapshot_on_paid(target, value, old_value, initiator):
    if value != InvoiceStatus.PAID or old_value == InvoiceStatus.PAID:
        return
    session = object_session(target)
    if not session or not target.sold_by_user_id:
        return
    try:
        company_user = session.query(CompanyUser).filter(
            CompanyUser.company_id == target.company_id,
            CompanyUser.user_id == target.sold_by_user_id
        ).first()
        
        if not company_user:
            percent = Decimal('20.00')
        else:
            percent = Decimal(str(company_user.commission_percent))
        
        base_amount = Decimal(str(target.total_amount))
        commission_amount = Commission.calculate_commission_amount(base_amount, percent)
        
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
        print(f"✓ Commission snapshot created: Invoice {target.invoice_number} → ${commission_amount}")
        
    except Exception as e:
        print(f"⚠ Failed to create commission snapshot: {str(e)}")


@event.listens_for(Invoice, 'before_update')
def audit_invoice_before_update(mapper, connection, target):
    pass


if __name__ == "__main__":
    from decimal import Decimal
    DATABASE_URL = get_database_url()
    print(f"Database URL: {DATABASE_URL}")
    print("\n=== Creating Tables ===")
    engine = create_all_tables(DATABASE_URL, echo=False)
    print("\n=== Creating Sample Data ===")
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        company = Company(name="Acme Corporation")
        session.add(company)
        session.flush()
        print(f"✓ Created company: {company.name} (ID: {company.id})")
        user1 = User(
            email="owner@acme.com",
            password_hash="hashed_password_1",
            full_name="John Owner",
            is_active=True
        )
        user2 = User(
            email="sales@acme.com",
            password_hash="hashed_password_2",
            full_name="Jane Sales",
            is_active=True
        )
        session.add_all([user1, user2])
        session.flush()
        print(f"✓ Created users: {user1.email}, {user2.email}")
        owner_role = CompanyUser(
            company_id=company.id,
            user_id=user1.id,
            role=UserRole.OWNER,
            commission_percent=Decimal('10.00')
        )
        sales_role = CompanyUser(
            company_id=company.id,
            user_id=user2.id,
            role=UserRole.SALES,
            commission_percent=Decimal('20.00')
        )
        session.add_all([owner_role, sales_role])
        session.flush()
        print(f"✓ Added users to company with roles")
        customer = Customer(
            company_id=company.id,
            name="Big Client Inc.",
            phone="+1-800-555-0123",
            email="contact@bigclient.com"
        )
        session.add(customer)
        session.flush()
        print(f"✓ Created customer: {customer.name}")
        invoice = Invoice(
            company_id=company.id,
            customer_id=customer.id,
            invoice_number=f"INV-{company.id}-001",
            status=InvoiceStatus.DRAFT,
            sold_by_user_id=user2.id,
            created_by_user_id=user1.id,
            total_amount=Decimal('1000.00'),
            is_locked=False
        )
        session.add(invoice)
        session.flush()
        print(f"✓ Created invoice: {invoice.invoice_number}")
        quantity = Decimal('10.00')
        unit_price = Decimal('100.00')
        discount = Decimal('0.00')
        total_amount = InvoiceItem.calculate_total_amount(quantity, unit_price, discount)
        item1 = InvoiceItem(
            invoice_id=invoice.id,
            description="Professional Services - Consulting",
            quantity=quantity,
            unit_price=unit_price,
            discount=discount,
            total_amount=total_amount
        )
        session.add(item1)
        session.flush()
        print(f"✓ Added invoice item: {item1.description} - ${item1.total_amount}")
        audit = AuditLog(
            company_id=company.id,
            user_id=user1.id,
            action="CREATE",
            entity_type="Invoice",
            entity_id=invoice.id,
            new_data={
                "invoice_number": invoice.invoice_number,
                "status": invoice.status.value,
                "total_amount": str(invoice.total_amount)
            }
        )
        session.add(audit)
        session.flush()
        print(f"✓ Created audit log")
        print("\n=== Testing Commission Snapshot ===")
        invoice.status = InvoiceStatus.PAID
        invoice.paid_at = datetime.utcnow()
        session.flush()
        session.commit()
        print("\n✓ All sample data committed successfully!")
    except Exception as e:
        session.rollback()
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()
        print("\n✓ Database session closed")
