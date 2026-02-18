#!/usr/bin/env python3
"""
RR-Accounting FastAPI Backend - Entrypoint (moved)

Run: uvicorn backend.app.main:app --reload
"""

#!/usr/bin/env python3
"""
RR-Accounting FastAPI Backend - Reference Implementation
This example shows how to implement REST API endpoints for the accounting system

Run: uvicorn backend.app.main:app --reload
Or: python -m uvicorn backend.app.main:app --reload

Then test with: python api_test_suite.py
"""

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
import uuid

# Import corrected models
from backend.app.models import (
    Base, Company, User, CompanyUser, Customer, Invoice, InvoiceItem,
    Commission, AuditLog, UserRole, InvoiceStatus, CommissionStatus,
    get_session, get_database_url
)

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

# ============================================================================
# Setup FastAPI & Database
# ============================================================================

app = FastAPI(
    title="RR-Accounting API",
    description="Multi-tenant accounting system with audit trail",
    version="1.0.0"
)

# Create database engine
engine = create_engine(get_database_url(), echo=False)

# Create all tables
Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency for database sessions."""
    db = Session(engine)
    try:
        yield db
    finally:
        db.close()

# ============================================================================
# Pydantic Models (Request/Response)
# ============================================================================

class CompanyCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CompanyResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CustomerCreate(BaseModel):
    company_id: str
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerResponse(BaseModel):
    id: str
    company_id: str
    name: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: str
    first_name: str
    last_name: str
    role: str  # owner, accountant, sales

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CompanyUserCreate(BaseModel):
    company_id: str
    user_id: str
    commission_percent: Decimal = Field(default="0.00")

class CompanyUserResponse(BaseModel):
    id: str
    company_id: str
    user_id: str
    commission_percent: Decimal
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    company_id: str
    customer_id: str
    sold_by_user_id: Optional[str] = None
    status: str = "draft"
    total_amount: Decimal = Field(default="0.00")
    notes: Optional[str] = None

class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    total_amount: Optional[Decimal] = None
    notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    company_id: str
    customer_id: str
    sold_by_user_id: Optional[str]
    created_by_user_id: Optional[str]
    status: str
    total_amount: Decimal
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceItemCreate(BaseModel):
    invoice_id: str
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    discount: Decimal = Field(default="0.00")
    total_amount: Decimal

class InvoiceItemResponse(BaseModel):
    id: str
    invoice_id: str
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    discount: Decimal
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CommissionResponse(BaseModel):
    id: str
    invoice_id: Optional[str]
    user_id: Optional[str]
    company_id: str
    base_amount: Decimal
    percent: Decimal
    commission_amount: Decimal
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    action: str
    user_id: Optional[str]
    old_data: Optional[dict]
    new_data: Optional[dict]
    timestamp: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health", status_code=200)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "RR-Accounting API is running",
        "timestamp": datetime.now().isoformat()
    }

# ============================================================================
# Company Endpoints
# ============================================================================

@app.post("/api/companies", response_model=CompanyResponse, status_code=201)
async def create_company(company: CompanyCreate, db: Session = None):
    """Create a new company."""
    if db is None:
        db = next(get_db())
    
    new_company = Company(
        name=company.name,
        email=company.email,
        phone=company.phone,
        address=company.address
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company

@app.get("/api/companies", response_model=List[CompanyResponse])
async def list_companies(skip: int = Query(0), limit: int = Query(10), db: Session = None):
    """List all companies."""
    if db is None:
        db = next(get_db())
    
    companies = db.query(Company).offset(skip).limit(limit).all()
    return companies

@app.get("/api/companies/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: str, db: Session = None):
    """Get a company by ID."""
    if db is None:
        db = next(get_db())
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@app.put("/api/companies/{company_id}", response_model=CompanyResponse)
async def update_company(company_id: str, company_update: CompanyUpdate, db: Session = None):
    """Update a company."""
    if db is None:
        db = next(get_db())
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company_update.name:
        company.name = company_update.name
    if company_update.email:
        company.email = company_update.email
    if company_update.phone:
        company.phone = company_update.phone
    if company_update.address:
        company.address = company_update.address
    
    db.commit()
    db.refresh(company)
    return company

# ============================================================================
# Customer Endpoints
# ============================================================================

@app.post("/api/customers", response_model=CustomerResponse, status_code=201)
async def create_customer(customer: CustomerCreate, db: Session = None):
    """Create a new customer."""
    if db is None:
        db = next(get_db())
    
    new_customer = Customer(
        company_id=customer.company_id,
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        address=customer.address
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@app.get("/api/customers", response_model=List[CustomerResponse])
async def list_customers(company_id: Optional[str] = None, skip: int = Query(0), limit: int = Query(10), db: Session = None):
    """List customers."""
    if db is None:
        db = next(get_db())
    
    query = db.query(Customer)
    if company_id:
        query = query.filter(Customer.company_id == company_id)
    
    customers = query.offset(skip).limit(limit).all()
    return customers

@app.get("/api/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, db: Session = None):
    """Get a customer by ID."""
    if db is None:
        db = next(get_db())
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.put("/api/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, customer_update: CustomerUpdate, db: Session = None):
    """Update a customer."""
    if db is None:
        db = next(get_db())
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if customer_update.name:
        customer.name = customer_update.name
    if customer_update.email:
        customer.email = customer_update.email
    if customer_update.phone:
        customer.phone = customer_update.phone
    if customer_update.address:
        customer.address = customer_update.address
    
    db.commit()
    db.refresh(customer)
    return customer

# ============================================================================
# User Endpoints
# ============================================================================

@app.post("/api/users", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate, db: Session = None):
    """Create a new user."""
    if db is None:
        db = next(get_db())
    
    new_user = User(
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/api/users", response_model=List[UserResponse])
async def list_users(skip: int = Query(0), limit: int = Query(10), db: Session = None):
    """List all users."""
    if db is None:
        db = next(get_db())
    
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: Session = None):
    """Get a user by ID."""
    if db is None:
        db = next(get_db())
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.delete("/api/users/{user_id}", status_code=204)
async def delete_user(user_id: str, db: Session = None):
    """Delete a user (preserves invoices, commissions via FK SET NULL)."""
    if db is None:
        db = next(get_db())
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return None

# ============================================================================
# Company User Endpoints
# ============================================================================

@app.post("/api/company-users", response_model=CompanyUserResponse, status_code=201)
async def assign_user_to_company(company_user: CompanyUserCreate, db: Session = None):
    """Assign user to company with commission percentage."""
    if db is None:
        db = next(get_db())
    
    new_company_user = CompanyUser(
        company_id=company_user.company_id,
        user_id=company_user.user_id,
        commission_percent=company_user.commission_percent
    )
    db.add(new_company_user)
    db.commit()
    db.refresh(new_company_user)
    return new_company_user

# ============================================================================
# Invoice Endpoints
# ============================================================================

@app.post("/api/invoices", response_model=InvoiceResponse, status_code=201)
async def create_invoice(invoice: InvoiceCreate, db: Session = None):
    """Create a new invoice."""
    if db is None:
        db = next(get_db())
    
    new_invoice = Invoice(
        company_id=invoice.company_id,
        customer_id=invoice.customer_id,
        sold_by_user_id=invoice.sold_by_user_id,
        status=invoice.status,
        total_amount=invoice.total_amount,
        notes=invoice.notes
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return new_invoice

@app.get("/api/invoices", response_model=List[InvoiceResponse])
async def list_invoices(
    company_id: Optional[str] = None,
    sold_by_user_id: Optional[str] = None,
    skip: int = Query(0),
    limit: int = Query(10),
    db: Session = None
):
    """List invoices."""
    if db is None:
        db = next(get_db())
    
    query = db.query(Invoice)
    if company_id:
        query = query.filter(Invoice.company_id == company_id)
    if sold_by_user_id:
        query = query.filter(Invoice.sold_by_user_id == sold_by_user_id)
    
    invoices = query.offset(skip).limit(limit).all()
    return invoices

@app.get("/api/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str, db: Session = None):
    """Get an invoice by ID."""
    if db is None:
        db = next(get_db())
    
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@app.put("/api/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(invoice_id: str, invoice_update: InvoiceUpdate, db: Session = None):
    """Update an invoice (triggers commission snapshot if status → PAID)."""
    if db is None:
        db = next(get_db())
    
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice_update.status:
        invoice.status = invoice_update.status
    if invoice_update.total_amount:
        invoice.total_amount = invoice_update.total_amount
    if invoice_update.notes:
        invoice.notes = invoice_update.notes
    
    db.commit()
    db.refresh(invoice)
    return invoice

# ============================================================================
# Invoice Item Endpoints
# ============================================================================

@app.post("/api/invoice-items", response_model=InvoiceItemResponse, status_code=201)
async def create_invoice_item(item: InvoiceItemCreate, db: Session = None):
    """Create an invoice item with validation (Issue #1)."""
    if db is None:
        db = next(get_db())
    
    # Validate total_amount = quantity * unit_price - discount
    expected_total = (item.quantity * item.unit_price) - item.discount
    expected_total = expected_total.quantize(Decimal('0.01'))
    
    if item.total_amount != expected_total:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid total_amount. Expected {expected_total}, got {item.total_amount}"
        )
    
    new_item = InvoiceItem(
        invoice_id=item.invoice_id,
        product_name=item.product_name,
        quantity=item.quantity,
        unit_price=item.unit_price,
        discount=item.discount,
        total_amount=item.total_amount
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@app.get("/api/invoice-items")
async def list_invoice_items(invoice_id: str, db: Session = None):
    """List invoice items."""
    if db is None:
        db = next(get_db())
    
    items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice_id).all()
    return items

# ============================================================================
# Commission Endpoints
# ============================================================================

@app.get("/api/commissions", response_model=List[CommissionResponse])
async def list_commissions(
    invoice_id: Optional[str] = None,
    user_id: Optional[str] = None,
    skip: int = Query(0),
    limit: int = Query(10),
    db: Session = None
):
    """List commissions."""
    if db is None:
        db = next(get_db())
    
    query = db.query(Commission)
    if invoice_id:
        query = query.filter(Commission.invoice_id == invoice_id)
    if user_id:
        query = query.filter(Commission.user_id == user_id)
    
    commissions = query.offset(skip).limit(limit).all()
    return commissions

@app.get("/api/commissions/{commission_id}", response_model=CommissionResponse)
async def get_commission(commission_id: str, db: Session = None):
    """Get a commission by ID."""
    if db is None:
        db = next(get_db())
    
    commission = db.query(Commission).filter(Commission.id == commission_id).first()
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    return commission

# ============================================================================
# Audit Log Endpoints
# ============================================================================

@app.get("/api/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    skip: int = Query(0),
    limit: int = Query(10),
    db: Session = None
):
    """List audit logs."""
    if db is None:
        db = next(get_db())
    
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs

# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8000)
