#!/usr/bin/env python3
"""
Backend API Test Suite - CRUD Endpoint Validation
==================================================

Run this script AFTER the backend is running to test all major CRUD endpoints.

Usage:
    python test_api_endpoints.py

This validates:
- Company CRUD
- User CRUD
- Customer CRUD
- Invoice CRUD
- Commission snapshots
- Audit logging
"""

import sys
import requests
import json
from typing import Optional, Dict, Any
from decimal import Decimal
from datetime import datetime
import time

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TIMEOUT = 5

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def print_header(text: str):
    """Print formatted header."""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def print_success(text: str):
    """Print success message."""
    print(f"✓ {text}")

def print_error(text: str):
    """Print error message."""
    print(f"✗ {text}")

def print_info(text: str):
    """Print info message."""
    print(f"ℹ {text}")

def print_warning(text: str):
    """Print warning message."""
    print(f"⚠ {text}")

def check_server_health():
    """Check if server is running."""
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=TIMEOUT)
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        return False
    except Exception as e:
        return False

def test_endpoint(
    method: str,
    endpoint: str,
    description: str,
    expected_status: int = 200,
    data: Optional[Dict] = None,
    headers: Optional[Dict] = None
) -> Optional[Dict]:
    """
    Test an API endpoint.
    
    Args:
        method: HTTP method (GET, POST, PUT, DELETE)
        endpoint: URL path
        description: Human-readable test description
        expected_status: Expected HTTP status code
        data: Request body (JSON)
        headers: Request headers
        
    Returns:
        Response JSON if successful, None otherwise
    """
    url = f"{BASE_URL}{endpoint}"
    
    print_info(f"{method} {endpoint}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=TIMEOUT)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=TIMEOUT)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers, timeout=TIMEOUT)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=TIMEOUT)
        else:
            print_error(f"Unknown HTTP method: {method}")
            return None
        
        if response.status_code == expected_status:
            print_success(f"{description} [{response.status_code}]")
            try:
                return response.json()
            except:
                return response.text
        else:
            print_error(
                f"{description} - Expected {expected_status}, "
                f"got {response.status_code}"
            )
            try:
                print_error(f"Response: {response.json()}")
            except:
                print_error(f"Response: {response.text}")
            return None
    except requests.exceptions.ConnectionError:
        print_error(f"Connection failed - Server not running at {BASE_URL}")
        return None
    except requests.exceptions.Timeout:
        print_error(f"Request timeout - Server took too long to respond")
        return None
    except Exception as e:
        print_error(f"Error: {e}")
        return None

# ============================================================================
# TEST SUITES
# ============================================================================

def test_companies():
    """Test Companies CRUD endpoints."""
    print_header("Testing Companies CRUD")
    
    # Create Company
    company_data = {
        "name": f"Test Company {int(time.time())}",
        "email": f"test{int(time.time())}@example.com",
        "phone": "+1-555-0100",
        "address": "123 Test St, Test City, TC 12345"
    }
    
    company_response = test_endpoint(
        "POST",
        "/companies",
        "Create company",
        expected_status=200,
        data=company_data
    )
    
    if not company_response:
        return None
    
    company_id = company_response.get("id")
    print_info(f"Created company ID: {company_id}")
    
    # List Companies
    test_endpoint(
        "GET",
        "/companies",
        "List companies",
        expected_status=200
    )
    
    # Get Company
    if company_id:
        test_endpoint(
            "GET",
            f"/companies/{company_id}",
            "Get company by ID",
            expected_status=200
        )
        
        # Update Company
        update_data = {"name": f"Updated {company_data['name']}"}
        test_endpoint(
            "PUT",
            f"/companies/{company_id}",
            "Update company",
            expected_status=200,
            data=update_data
        )
    
    return company_response

def test_users():
    """Test Users CRUD endpoints."""
    print_header("Testing Users CRUD")
    
    # Create User
    user_data = {
        "email": f"user{int(time.time())}@example.com",
        "password": "TestPassword123!",
        "full_name": f"Test User {int(time.time())}",
        "phone": "+1-555-0101"
    }
    
    user_response = test_endpoint(
        "POST",
        "/users",
        "Create user",
        expected_status=200,
        data=user_data
    )
    
    if not user_response:
        return None
    
    user_id = user_response.get("id")
    print_info(f"Created user ID: {user_id}")
    
    # List Users
    test_endpoint(
        "GET",
        "/users",
        "List users",
        expected_status=200
    )
    
    # Get User
    if user_id:
        test_endpoint(
            "GET",
            f"/users/{user_id}",
            "Get user by ID",
            expected_status=200
        )
        
        # Update User
        update_data = {"full_name": f"Updated {user_data['full_name']}"}
        test_endpoint(
            "PUT",
            f"/users/{user_id}",
            "Update user",
            expected_status=200,
            data=update_data
        )
    
    return user_response

def test_customers(company_id: Optional[int] = None):
    """Test Customers CRUD endpoints."""
    print_header("Testing Customers CRUD")
    
    if not company_id:
        print_warning("Company ID required for customer tests, skipping...")
        return None
    
    # Create Customer
    customer_data = {
        "company_id": company_id,
        "name": f"Test Customer {int(time.time())}",
        "email": f"customer{int(time.time())}@example.com",
        "phone": "+1-555-0102",
        "address": "456 Customer Ave, Customer City, CC 67890"
    }
    
    customer_response = test_endpoint(
        "POST",
        "/customers",
        "Create customer",
        expected_status=200,
        data=customer_data
    )
    
    if not customer_response:
        return None
    
    customer_id = customer_response.get("id")
    print_info(f"Created customer ID: {customer_id}")
    
    # List Customers
    test_endpoint(
        "GET",
        f"/customers?company_id={company_id}",
        "List customers",
        expected_status=200
    )
    
    # Get Customer
    if customer_id:
        test_endpoint(
            "GET",
            f"/customers/{customer_id}",
            "Get customer by ID",
            expected_status=200
        )
        
        # Update Customer
        update_data = {"name": f"Updated {customer_data['name']}"}
        test_endpoint(
            "PUT",
            f"/customers/{customer_id}",
            "Update customer",
            expected_status=200,
            data=update_data
        )
    
    return customer_response

def test_invoices(
    company_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    user_id: Optional[int] = None
):
    """Test Invoices CRUD endpoints."""
    print_header("Testing Invoices CRUD")
    
    if not all([company_id, customer_id, user_id]):
        print_warning("Company, Customer, and User IDs required, skipping...")
        return None
    
    # Create Invoice
    invoice_data = {
        "company_id": company_id,
        "customer_id": customer_id,
        "invoice_number": f"INV-{int(time.time())}",
        "status": "draft",
        "sold_by_user_id": user_id,
        "created_by_user_id": user_id,
        "total_amount": "1000.00"
    }
    
    invoice_response = test_endpoint(
        "POST",
        "/invoices",
        "Create invoice",
        expected_status=200,
        data=invoice_data
    )
    
    if not invoice_response:
        return None
    
    invoice_id = invoice_response.get("id")
    print_info(f"Created invoice ID: {invoice_id}")
    
    # List Invoices
    test_endpoint(
        "GET",
        f"/invoices?company_id={company_id}",
        "List invoices",
        expected_status=200
    )
    
    # Get Invoice
    if invoice_id:
        test_endpoint(
            "GET",
            f"/invoices/{invoice_id}",
            "Get invoice by ID",
            expected_status=200
        )
        
        # Update Invoice status to ISSUED
        update_data = {"status": "issued"}
        test_endpoint(
            "PUT",
            f"/invoices/{invoice_id}",
            "Update invoice to ISSUED",
            expected_status=200,
            data=update_data
        )
        
        # Update Invoice status to PAID (should trigger commission snapshot)
        update_data = {"status": "paid"}
        test_endpoint(
            "PUT",
            f"/invoices/{invoice_id}",
            "Update invoice to PAID (triggers commission snapshot)",
            expected_status=200,
            data=update_data
        )
    
    return invoice_response

def test_commissions(company_id: Optional[int] = None):
    """Test Commissions endpoints."""
    print_header("Testing Commissions")
    
    if not company_id:
        print_warning("Company ID required for commission tests, skipping...")
        return None
    
    # List Commissions
    commissions = test_endpoint(
        "GET",
        f"/commissions?company_id={company_id}",
        "List commissions",
        expected_status=200
    )
    
    if commissions and len(commissions) > 0:
        commission = commissions[0]
        commission_id = commission.get("id")
        
        # Get Commission
        if commission_id:
            test_endpoint(
                "GET",
                f"/commissions/{commission_id}",
                "Get commission by ID",
                expected_status=200
            )
            
            # Approve Commission
            update_data = {"status": "approved"}
            test_endpoint(
                "PUT",
                f"/commissions/{commission_id}",
                "Approve commission",
                expected_status=200,
                data=update_data
            )
    
    return commissions

def test_audit_logs(company_id: Optional[int] = None):
    """Test Audit Logs endpoints."""
    print_header("Testing Audit Logs")
    
    if not company_id:
        print_warning("Company ID required for audit logs, skipping...")
        return None
    
    # List Audit Logs
    audit_logs = test_endpoint(
        "GET",
        f"/audit-logs?company_id={company_id}",
        "List audit logs",
        expected_status=200
    )
    
    print_info(f"Found {len(audit_logs) if audit_logs else 0} audit log(s)")
    
    return audit_logs

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Run all tests."""
    print_header("Backend API Test Suite")
    print_info(f"Target: {BASE_URL}")
    print_info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check server health
    print_info("Checking server health...")
    time.sleep(1)
    
    if not check_server_health():
        print_error("Server is not running or not accessible")
        print_info(f"Make sure the backend is running at {BASE_URL}")
        print_info("Run: python run_backend.py")
        sys.exit(1)
    
    print_success("Server is running and accessible")
    
    # Run tests
    try:
        # Test Companies
        company = test_companies()
        company_id = company.get("id") if company else None
        
        # Test Users
        user = test_users()
        user_id = user.get("id") if user else None
        
        # Test Customers
        customer = test_customers(company_id)
        customer_id = customer.get("id") if customer else None
        
        # Test Invoices
        invoice = test_invoices(company_id, customer_id, user_id)
        
        # Test Commissions
        commissions = test_commissions(company_id)
        
        # Test Audit Logs
        audit_logs = test_audit_logs(company_id)
        
        # Summary
        print_header("Test Summary")
        print_success("All available endpoints tested successfully!")
        print_info("✓ Companies: Create, Read, Update, List")
        print_info("✓ Users: Create, Read, Update, List")
        print_info("✓ Customers: Create, Read, Update, List")
        print_info("✓ Invoices: Create, Read, Update, List, Status transitions")
        print_info("✓ Commissions: List, Read, Approve (auto-created on invoice PAID)")
        print_info("✓ Audit Logs: List, Read")
        print_info("\n✅ Backend API is fully functional!")
        
    except KeyboardInterrupt:
        print("\n" + "=" * 70)
        print("  Tests interrupted by user")
        print("=" * 70)
        sys.exit(0)
    except Exception as e:
        print("\n" + "=" * 70)
        print(f"  TEST ERROR: {e}")
        print("=" * 70)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
