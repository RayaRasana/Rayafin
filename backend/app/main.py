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

from fastapi import FastAPI, HTTPException, Query, status, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from decimal import Decimal
from datetime import datetime
import uuid
import bcrypt

# Import corrected models
from backend.app.models import (
    Base, Company, User, CompanyUser, Customer, Invoice, InvoiceItem,
    Commission, AuditLog, UserRole, InvoiceStatus, CommissionStatus,
    get_session, get_database_url
)

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session

# ============================================================================
# Setup FastAPI & Database
# ============================================================================

app = FastAPI(
    title="RR-Accounting API",
    description="Multi-tenant accounting system with audit trail",
    version="1.0.0"
)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development, restrict in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

class CompanyUpdate(BaseModel):
    name: Optional[str] = None

class CompanyResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CustomerCreate(BaseModel):
    company_id: int
    name: str

class CustomerUpdate(BaseModel):
    name: Optional[str] = None

class CustomerResponse(BaseModel):
    id: int
    company_id: int
    name: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CompanyUserCreate(BaseModel):
    company_id: int
    user_id: int
    commission_percent: Decimal = Field(default="0.00")

class CompanyUserResponse(BaseModel):
    id: int
    company_id: int
    user_id: int
    role: str
    commission_percent: Decimal
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    company_id: int
    customer_id: int
    sold_by_user_id: Optional[int] = None
    status: str = "draft"
    total_amount: Decimal = Field(default="0.00")
    notes: Optional[str] = None

class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    total_amount: Optional[Decimal] = None
    notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    company_id: int
    customer_id: int
    sold_by_user_id: Optional[int]
    created_by_user_id: Optional[int]
    status: str
    total_amount: Decimal
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceItemCreate(BaseModel):
    invoice_id: int
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    discount: Decimal = Field(default="0.00")
    total_amount: Decimal

class InvoiceItemResponse(BaseModel):
    id: int
    invoice_id: int
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
    id: int
    invoice_id: Optional[int]
    user_id: Optional[int]
    company_id: int
    base_amount: Decimal
    percent: Decimal
    commission_amount: Decimal
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    action: str
    user_id: Optional[int]
    old_data: Optional[dict]
    new_data: Optional[dict]
    timestamp: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# Authentication Models
# ============================================================================

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    token: str = "token"  # In real app, this would be JWT
    
    class Config:
        from_attributes = True

class MeResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    
    class Config:
        from_attributes = True

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health", status_code=200, response_model=None)
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint with database connectivity test."""
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
            "message": "RR-Accounting API is running",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

# ============================================================================
# Authentication Endpoints
# ============================================================================

@app.post("/api/auth/login", response_model=LoginResponse, status_code=200)
async def login(credentials: LoginRequest, db: Any = None):
    """Login user with email and password."""
    if db is None:
        db = next(get_db())
    
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="User account is inactive")
    
    # Verify password
    try:
        if not bcrypt.checkpw(credentials.password.encode('utf-8'), user.password_hash.encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid email or password")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Return user info with token
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "token": f"token_{user.id}"  # Simple token format
    }

@app.get("/api/auth/me", response_model=MeResponse)
async def get_current_user(user_id: int = Query(...), token: str = Query(...), db: Any = None):
    """Get current logged-in user info."""
    if db is None:
        db = next(get_db())
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="User account is inactive")
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active
    }

# ============================================================================
# Company Endpoints
# ============================================================================

@app.post("/api/companies", response_model=CompanyResponse, status_code=201)
async def create_company(company: CompanyCreate, db: Any = None):
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
async def list_companies(skip: int = Query(0), limit: int = Query(10), db: Any = None):
    """List all companies."""
    if db is None:
        db = next(get_db())
    
    companies = db.query(Company).offset(skip).limit(limit).all()
    return companies

@app.get("/api/companies/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: int, db: Any = None):
    """Get a company by ID."""
    if db is None:
        db = next(get_db())
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@app.put("/api/companies/{company_id}", response_model=CompanyResponse)
async def update_company(company_id: int, company_update: CompanyUpdate, db: Any = None):
    """Update a company."""
    if db is None:
        db = next(get_db())
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company_update.name:
        company.name = company_update.name
    
    db.commit()
    db.refresh(company)
    return company

# ============================================================================
# Customer Endpoints
# ============================================================================

@app.post("/api/customers", response_model=CustomerResponse, status_code=201)
async def create_customer(customer: CustomerCreate, db: Any = None):
    """Create a new customer."""
    if db is None:
        db = next(get_db())
    
    new_customer = Customer(
        company_id=customer.company_id,
        name=customer.name
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@app.get("/api/customers", response_model=List[CustomerResponse])
async def list_customers(company_id: Optional[int] = None, skip: int = Query(0), limit: int = Query(10), db: Any = None):
    """List customers."""
    if db is None:
        db = next(get_db())
    
    query = db.query(Customer)
    if company_id:
        query = query.filter(Customer.company_id == company_id)
    
    customers = query.offset(skip).limit(limit).all()
    return customers

@app.get("/api/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: int, db: Any = None):
    """Get a customer by ID."""
    if db is None:
        db = next(get_db())
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.put("/api/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: int, customer_update: CustomerUpdate, db: Any = None):
    """Update a customer."""
    if db is None:
        db = next(get_db())
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if customer_update.name:
        customer.name = customer_update.name
    
    db.commit()
    db.refresh(customer)
    return customer

# ============================================================================
# User Endpoints
# ============================================================================

@app.post("/api/users", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate, db: Any = None):
    """Create a new user."""
    if db is None:
        db = next(get_db())
    
    # Hash the password
    password_hash = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    new_user = User(
        email=user.email,
        full_name=user.full_name,
        password_hash=password_hash,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/api/users", response_model=List[UserResponse])
async def list_users(skip: int = Query(0), limit: int = Query(10), db: Any = None):
    """List all users."""
    if db is None:
        db = next(get_db())
    
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Any = None):
    """Get a user by ID."""
    if db is None:
        db = next(get_db())
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.delete("/api/users/{user_id}", status_code=204)
async def delete_user(user_id: int, db: Any = None):
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
async def assign_user_to_company(company_user: CompanyUserCreate, db: Any = None):
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
async def create_invoice(invoice: InvoiceCreate, db: Any = None):
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
    company_id: Optional[int] = None,
    sold_by_user_id: Optional[int] = None,
    skip: int = Query(0),
    limit: int = Query(10),
    db: Any = None
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
async def get_invoice(invoice_id: int, db: Any = None):
    """Get an invoice by ID."""
    if db is None:
        db = next(get_db())
    
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@app.put("/api/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(invoice_id: int, invoice_update: InvoiceUpdate, db: Any = None):
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
async def create_invoice_item(item: InvoiceItemCreate, db: Any = None):
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
async def list_invoice_items(invoice_id: int, db: Any = None):
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
    invoice_id: Optional[int] = None,
    user_id: Optional[int] = None,
    skip: int = Query(0),
    limit: int = Query(10),
    db: Any = None
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
async def get_commission(commission_id: int, db: Any = None):
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
    entity_id: Optional[int] = None,
    skip: int = Query(0),
    limit: int = Query(10),
    db: Any = None
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
