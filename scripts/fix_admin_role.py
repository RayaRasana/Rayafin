#!/usr/bin/env python3
"""
Fix Admin Role from lowercase to OWNER
"""

import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

load_dotenv()

from backend.app.models import get_database_url

def fix_admin_role():
    try:
        engine = create_engine(get_database_url(), echo=False)
        db = Session(engine)
        
        try:
            # Update lowercase 'owner' to uppercase 'OWNER'
            result = db.execute(text("""
                UPDATE company_users 
                SET role = 'OWNER'
                WHERE user_id = 1 AND role = 'owner'
            """))
            db.commit()
            
            print(f"[OK] Updated {result.rowcount} row(s)")
            
            # Verify
            result = db.execute(text("""
                SELECT cu.id, c.id, c.name, cu.role
                FROM company_users cu
                JOIN companies c ON cu.company_id = c.id
                WHERE cu.user_id = 1
            """))
            
            row = result.first()
            if row:
                print("[OK] Admin User Configuration:")
                print(f"     Company ID: {row[1]}")
                print(f"     Company:    {row[2]}")
                print(f"     Role:       {row[3]}")
                return True
            else:
                print("[ERROR] Admin user not found")
                return False
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = fix_admin_role()
    sys.exit(0 if success else 1)
