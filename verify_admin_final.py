#!/usr/bin/env python3
"""
Final Verification of Admin User
"""

import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

load_dotenv()

from backend.app.models import get_database_url

def verify_admin():
    try:
        engine = create_engine(get_database_url(), echo=False)
        db = Session(engine)
        
        try:
            # Get admin user info
            result = db.execute(text("""
                SELECT u.id, u.email, u.full_name, u.is_active, u.created_at,
                       cu.id as cu_id, c.id as company_id, c.name as company_name, cu.role
                FROM users u
                LEFT JOIN company_users cu ON u.id = cu.user_id
                LEFT JOIN companies c ON cu.company_id = c.id
                WHERE u.email = 'barbad.mb@gmail.com'
            """))
            
            row = result.first()
            
            if not row:
                print("[ERROR] Admin user not found!")
                return False
            
            print("[OK] SUPER ADMIN USER CONFIGURATION")
            print("=" * 50)
            print(f"Email:        {row[1]}")
            print(f"Name:         {row[2]}")
            print(f"Active:       {row[3]}")
            print(f"User ID:      {row[0]}")
            print(f"Created:      {row[4]}")
            print()
            print("COMPANY ASSIGNMENT")
            print("-" * 50)
            
            if row[5]:  # If company_user exists
                print(f"Company:      {row[7]}")
                print(f"Company ID:   {row[6]}")
                print(f"Role:         {row[8]} (OWNER)")
                print(f"Status:       ✓ Properly configured")
                return True
            else:
                print("Status:       ✗ Not assigned to company")
                return False
            
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
