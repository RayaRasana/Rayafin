#!/usr/bin/env python3
"""
Check PostgreSQL Enum Values
"""

import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

load_dotenv()

from backend.app.models import get_database_url

def check_enums():
    try:
        engine = create_engine(get_database_url(), echo=False)
        db = Session(engine)
        
        try:
            # Check what enum values exist for user_role
            result = db.execute(text("""
                SELECT enumlabel 
                FROM pg_enum
                JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
                WHERE pg_type.typname = 'user_role'
                ORDER BY enumsortorder
            """))
            
            values = result.fetchall()
            print("[OK] PostgreSQL user_role Enum Values:")
            for row in values:
                print(f"     - {row[0]}")
            
            if not values:
                print("[INFO] No enum values found - checking if enum exists...")
                result = db.execute(text("""
                    SELECT typname FROM pg_type WHERE typname = 'user_role'
                """))
                if result.first():
                    print("[INFO] user_role enum exists but has no values")
                else:
                    print("[ERROR] user_role enum type not found")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = check_enums()
    sys.exit(0 if success else 1)
