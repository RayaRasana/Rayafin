#!/usr/bin/env python3
"""
Verify Admin User Script
"""

import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

load_dotenv()

from backend.app.models import Base, User, Company, CompanyUser, get_database_url

def verify_admin():
    try:
        engine = create_engine(get_database_url(), echo=False)
        db = Session(engine)
        
        try:
            user = db.query(User).filter(User.email == "barbad.mb@gmail.com").first()
            
            if not user:
                print("[ERROR] Admin user not found!")
                return False
            
            print("[OK] Admin User Found!")
            print(f"     Email:     {user.email}")
            print(f"     Name:      {user.full_name}")
            print(f"     User ID:   {user.id}")
            print(f"     Active:    {user.is_active}")
            print(f"     Created:   {user.created_at}")
            
            # Check company assignment
            company_user = db.query(CompanyUser).filter(CompanyUser.user_id == user.id).first()
            
            if company_user:
                company = db.query(Company).filter(Company.id == company_user.company_id).first()
                print(f"\n     Company:   {company.name}")
                print(f"     Company ID: {company.id}")
                print(f"     Role:      {company_user.role}")
                print(f"     Commission: {company_user.commission_percent}%")
            else:
                print("\n[WARN] User not assigned to any company!")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = verify_admin()
    sys.exit(0 if success else 1)
