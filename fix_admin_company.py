#!/usr/bin/env python3
"""
Assign Admin to Company with Raw SQL
"""

import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

load_dotenv()

from backend.app.models import get_database_url

def fix_admin_company():
    try:
        engine = create_engine(get_database_url(), echo=False)
        db = Session(engine)
        
        try:
            # Get user ID
            result = db.execute(text("SELECT id FROM users WHERE email = 'barbad.mb@gmail.com'"))
            user_row = result.first()
            
            if not user_row:
                print("[ERROR] Admin user not found!")
                return False
            
            user_id = user_row[0]
            
            # Check if already has company
            result = db.execute(text("SELECT id FROM company_users WHERE user_id = :user_id"), {"user_id": user_id})
            if result.first():
                print("[WARN] User already assigned to a company")
                # Just verify and print
                result = db.execute(text("""
                    SELECT cu.id, c.id, c.name, cu.role
                    FROM company_users cu
                    JOIN companies c ON cu.company_id = c.id
                    WHERE cu.user_id = :user_id
                """), {"user_id": user_id})
                row = result.first()
                print(f"     Company:   {row[2]}")
                print(f"     Company ID: {row[1]}")
                print(f"     Role:      {row[3]}")
                return True
            
            # Check for bad data (role = 'owner' instead of 'OWNER')
            result = db.execute(text("SELECT id FROM company_users WHERE user_id = :user_id AND role = 'owner'"), {"user_id": user_id})
            if result.first():
                print("[INFO] Fixing bad enum data...")
                db.execute(text("DELETE FROM company_users WHERE user_id = :user_id AND role = 'owner'"), {"user_id": user_id})
                db.commit()
            
            # Create company
            db.execute(text("""
                INSERT INTO companies (name, created_at, updated_at)
                VALUES (:name, NOW(), NOW())
            """), {"name": f"Barbod Marzban's Company"})
            db.commit()
            
            # Get the company ID
            result = db.execute(text("SELECT id FROM companies ORDER BY created_at DESC LIMIT 1"))
            company_id = result.first()[0]
            
            # Insert company_user with correct OWNER value
            db.execute(text("""
                INSERT INTO company_users (company_id, user_id, role, commission_percent, created_at, updated_at)
                VALUES (:company_id, :user_id, 'OWNER', 0.00, NOW(), NOW())
            """), {"company_id": company_id, "user_id": user_id})
            db.commit()
            
            print("[OK] Admin Assigned to Company!")
            print(f"     Company ID: {company_id}")
            print(f"     Company:    Barbod Marzban's Company")
            print(f"     Role:       OWNER")
            print(f"     Commission: 0.00%")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = fix_admin_company()
    sys.exit(0 if success else 1)
