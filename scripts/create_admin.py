#!/usr/bin/env python3
"""
Create Super Admin User Script
Adds a super admin (owner) user to the RR-Accounting database
"""

import sys
import os
from dotenv import load_dotenv
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# Load environment variables
load_dotenv()

# Import models
from backend.app.models import Base, User, Company, CompanyUser, UserRole, get_database_url

def create_admin_user(email: str, password: str, full_name: str):
    """Create a super admin user in the database."""
    
    try:
        # Create database engine
        engine = create_engine(get_database_url(), echo=False)
        
        # Create all tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        # Create database session
        db = Session(engine)
        
        try:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                print(f"[ERROR] User with email {email} already exists!")
                return False
            
            # Hash the password
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Create new user
            admin_user = User(
                email=email,
                full_name=full_name,
                password_hash=password_hash,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            # Create a company for the admin
            company = Company(
                name=f"{full_name}'s Company"
            )
            db.add(company)
            db.commit()
            db.refresh(company)
            
            # Link user to company as OWNER
            company_user = CompanyUser(
                company_id=company.id,
                user_id=admin_user.id,
                role="owner",  # Use string value directly
                commission_percent=0  # Admin doesn't earn commission
            )
            db.add(company_user)
            db.commit()
            db.refresh(company_user)
            
            print("[OK] Super Admin User Created Successfully!")
            print(f"     Email:     {admin_user.email}")
            print(f"     Name:      {admin_user.full_name}")
            print(f"     Role:      OWNER (Super Admin)")
            print(f"     User ID:   {admin_user.id}")
            print(f"     Company:   {company.name}")
            print(f"     Company ID: {company.id}")
            print(f"     Created:   {admin_user.created_at}")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"[ERROR] Failed to create admin user: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Create super admin user
    success = create_admin_user(
        email="barbad.mb@gmail.com",
        password="Adadep1625",
        full_name="Barbod Marzban"
    )
    
    sys.exit(0 if success else 1)
