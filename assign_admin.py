#!/usr/bin/env python3
"""
Assign Admin to Company Script
"""

import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from decimal import Decimal

load_dotenv()

from backend.app.models import Base, User, Company, CompanyUser, UserRole, get_database_url

def assign_admin_to_company():
    try:
        engine = create_engine(get_database_url(), echo=False)
        db = Session(engine)
        
        try:
            # Find the admin user
            user = db.query(User).filter(User.email == "barbad.mb@gmail.com").first()
            if not user:
                print("[ERROR] Admin user not found!")
                return False
            
            # Check if already assigned
            existing = db.query(CompanyUser).filter(CompanyUser.user_id == user.id).first()
            if existing:
                print("[ERROR] User already assigned to a company!")
                return False
            
            # Create a company for the admin
            company = Company(
                name=f"{user.full_name}'s Company"
            )
            db.add(company)
            db.commit()
            db.refresh(company)
            
            # Assign user to company as OWNER
            company_user = CompanyUser(
                company_id=company.id,
                user_id=user.id,
                role=UserRole.OWNER,
                commission_percent=Decimal("0.00")
            )
            db.add(company_user)
            db.commit()
            db.refresh(company_user)
            
            print("[OK] Admin Assigned to Company!")
            print(f"     Company:   {company.name}")
            print(f"     Company ID: {company.id}")
            print(f"     Role:      {company_user.role}")
            print(f"     Commission: {company_user.commission_percent}%")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = assign_admin_to_company()
    sys.exit(0 if success else 1)
