#!/usr/bin/env python3
"""
Complete Owner Setup Script for RR-Accounting
Creates everything needed for a company owner:
- Company
- Owner user account
- Company-User relationship with OWNER role
"""

import sys
from dotenv import load_dotenv
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# Load environment variables
load_dotenv()

# Import models
from backend.app.models import (
    Base, User, Company, CompanyUser, UserRole, get_database_url
)


def create_complete_owner_setup(
    company_name: str,
    owner_email: str,
    owner_password: str,
    owner_full_name: str,
    commission_percent: float = 20.0
):
    """
    Create a complete owner setup: company + user + owner relationship.
    
    Args:
        company_name: Name of the company to create
        owner_email: Email for the owner account
        owner_password: Password for the owner account
        owner_full_name: Full name of the owner
        commission_percent: Commission percentage for sales (default: 20.0)
    
    Returns:
        tuple: (success: bool, company_id: int, user_id: int, message: str)
    """
    
    print(f"\n{'='*70}")
    print(f"  RR-Accounting Owner Setup")
    print(f"{'='*70}")
    
    try:
        # Create database engine
        print(f"[INFO] Connecting to database...")
        engine = create_engine(get_database_url(), echo=False)
        
        # Create all tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        # Create database session
        db = Session(engine)
        
        try:
            # Step 1: Check if company already exists
            print(f"[INFO] Checking if company '{company_name}' exists...")
            existing_company = db.query(Company).filter(Company.name == company_name).first()
            
            if existing_company:
                print(f"[WARN] Company '{company_name}' already exists (ID: {existing_company.id})")
                company = existing_company
            else:
                # Create company
                print(f"[INFO] Creating company '{company_name}'...")
                company = Company(name=company_name)
                db.add(company)
                db.flush()  # Get the company ID
                print(f"[OK] Company created (ID: {company.id})")
            
            # Step 2: Check if user already exists
            print(f"[INFO] Checking if user '{owner_email}' exists...")
            existing_user = db.query(User).filter(User.email == owner_email).first()
            
            if existing_user:
                print(f"[WARN] User '{owner_email}' already exists (ID: {existing_user.id})")
                user = existing_user
            else:
                # Create user
                print(f"[INFO] Creating owner user '{owner_email}'...")
                password_hash = bcrypt.hashpw(
                    owner_password.encode('utf-8'), 
                    bcrypt.gensalt()
                ).decode('utf-8')
                
                user = User(
                    email=owner_email,
                    full_name=owner_full_name,
                    password_hash=password_hash,
                    is_active=True
                )
                db.add(user)
                db.flush()  # Get the user ID
                print(f"[OK] User created (ID: {user.id})")
            
            # Step 3: Create or update company-user relationship with OWNER role
            print(f"[INFO] Setting up owner relationship...")
            existing_relationship = db.query(CompanyUser).filter(
                CompanyUser.company_id == company.id,
                CompanyUser.user_id == user.id
            ).first()
            
            if existing_relationship:
                print(f"[WARN] Relationship already exists, updating to OWNER role...")
                existing_relationship.role = UserRole.OWNER
                existing_relationship.commission_percent = commission_percent
                company_user = existing_relationship
            else:
                company_user = CompanyUser(
                    company_id=company.id,
                    user_id=user.id,
                    role=UserRole.OWNER,
                    commission_percent=commission_percent
                )
                db.add(company_user)
                print(f"[OK] Owner relationship created")
            
            # Commit all changes
            db.commit()
            
            print(f"\n{'='*70}")
            print(f"  Setup Complete!")
            print(f"{'='*70}")
            print(f"[OK] Company: {company.name} (ID: {company.id})")
            print(f"[OK] Owner: {user.full_name} <{user.email}> (ID: {user.id})")
            print(f"[OK] Role: OWNER")
            print(f"[OK] Commission: {commission_percent}%")
            print(f"\n[INFO] Login credentials:")
            print(f"  Email: {owner_email}")
            print(f"  Password: {owner_password}")
            print(f"{'='*70}\n")
            
            return True, company.id, user.id, "Success"
            
        except Exception as e:
            db.rollback()
            error_msg = f"Database operation failed: {str(e)}"
            print(f"[ERROR] {error_msg}")
            return False, None, None, error_msg
            
        finally:
            db.close()
            
    except Exception as e:
        error_msg = f"Failed to connect to database: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return False, None, None, error_msg

def interactive_setup():
    """Interactive mode for creating owner setup."""
    
    print(f"\n{'='*70}")
    print(f"  Interactive Owner Setup")
    print(f"{'='*70}\n")
    
    # Get company information
    company_name = input("Enter company name: ").strip()
    if not company_name:
        print("[ERROR] Company name cannot be empty!")
        return False
    
    # Get owner information
    print("\n--- Owner Account Information ---")
    owner_full_name = input("Enter owner full name: ").strip()
    if not owner_full_name:
        print("[ERROR] Owner name cannot be empty!")
        return False
    
    owner_email = input("Enter owner email: ").strip()
    if not owner_email or '@' not in owner_email:
        print("[ERROR] Invalid email address!")
        return False
    
    owner_password = input("Enter owner password: ").strip()
    if not owner_password or len(owner_password) < 6:
        print("[ERROR] Password must be at least 6 characters!")
        return False
    
    # Optional: Commission percentage
    commission_input = input("Enter commission percentage (default: 20.0): ").strip()
    commission_percent = 20.0
    if commission_input:
        try:
            commission_percent = float(commission_input)
            if commission_percent < 0 or commission_percent > 100:
                print("[ERROR] Commission must be between 0 and 100!")
                return False
        except ValueError:
            print("[ERROR] Invalid commission percentage!")
            return False
    
    # Confirm setup
    print(f"\n--- Review Your Setup ---")
    print(f"Company Name: {company_name}")
    print(f"Owner Name: {owner_full_name}")
    print(f"Owner Email: {owner_email}")
    print(f"Commission: {commission_percent}%")
    
    confirm = input("\nProceed with setup? (yes/no): ").lower()
    if confirm != 'yes':
        print("[INFO] Setup cancelled")
        return False
    
    # Create setup
    success, company_id, user_id, message = create_complete_owner_setup(
        company_name=company_name,
        owner_email=owner_email,
        owner_password=owner_password,
        owner_full_name=owner_full_name,
        commission_percent=commission_percent
    )
    
    return success

def main():
    """Main execution."""
    
    if len(sys.argv) > 1:
        # Command-line mode
        if len(sys.argv) < 5:
            print("Usage: python setup_owner.py <company_name> <owner_email> <owner_password> <owner_full_name> [commission_percent]")
            print("   or: python setup_owner.py  (for interactive mode)")
            return 1
        
        company_name = sys.argv[1]
        owner_email = sys.argv[2]
        owner_password = sys.argv[3]
        owner_full_name = sys.argv[4]
        commission_percent = float(sys.argv[5]) if len(sys.argv) > 5 else 20.0
        
        success, _, _, _ = create_complete_owner_setup(
            company_name=company_name,
            owner_email=owner_email,
            owner_password=owner_password,
            owner_full_name=owner_full_name,
            commission_percent=commission_percent
        )
        
        return 0 if success else 1
    else:
        # Interactive mode
        success = interactive_setup()
        return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
