# 🧪 API Test Suite Usage Guide

## Overview

The `api_test_suite.py` script provides comprehensive testing for the RR-Accounting backend API. It validates:

1. **CRUD Operations** - Create, Read, Update, Delete for all entities
2. **Business Rules** - Invoice item calculations, commission snapshots, audit logging
3. **Data Integrity** - User deletion preserves financial records
4. **Numeric Precision** - Decimal arithmetic verification
5. **Timestamp Management** - Automatic update_at management

---

## Quick Start

### Prerequisites

```bash
pip install requests
```

### Run Tests

```bash
python api_test_suite.py
```

### Expected Output

```
==============================
  RR-Accounting API Test Suite
  Backend: http://127.0.0.1:8000
==============================

✓ PASS - Backend Health Check
  API is running at http://127.0.0.1:8000

==============================
▶ 1. Company CRUD Operations
==============================

✓ CREATE Company
  5 × $100.00 - $50.00 = $450.00
...
```

---

## Test Structure

### 1. **Health Check** (Step 0)
- Verifies backend is running and accessible
- Tests `/health` endpoint

### 2. **Company CRUD** (Step 1)
- `POST /api/companies` - Create company
- `GET /api/companies/{id}` - Read company
- `PUT /api/companies/{id}` - Update company
- `GET /api/companies` - List companies

### 3. **Customer CRUD** (Step 2)
- `POST /api/customers` - Create customer
- `GET /api/customers/{id}` - Read customer
- `PUT /api/customers/{id}` - Update customer

### 4. **User Creation** (Step 3)
- `POST /api/users` - Create user (role: sales)
- `POST /api/company-users` - Assign user to company with commission

### 5. **Invoice CRUD** (Step 4)
- `POST /api/invoices` - Create invoice (status: draft)
- `GET /api/invoices/{id}` - Read invoice

### 6. **InvoiceItem Validation** (Step 5)
- Tests the formula: `total_amount = quantity * unit_price - discount`
- **Issue #1**: Validates CHECK constraints
- Tests valid and invalid calculations
- Expected values:
  - Case 1: 5 × $100 - $50 = $450.00 ✓
  - Case 2: 10 × $50 - $0 = INVALID $400 (rejected)
  - Case 3: 7 × $49.99 - $17.43 = $332.50 ✓

### 7. **Commission Snapshot** (Step 6)
- **Issue #6**: Commission creation when invoice status → PAID
- Changes invoice status to "paid"
- Verifies commission record is created
- Checks Decimal precision in commission calculation

### 8. **Audit Logging** (Step 7)
- **Issue #7**: Audit trail for invoice changes
- Queries audit logs for the invoice
- Verifies JSON snapshots (old_data, new_data)
- Checks for CREATE and UPDATE actions

### 9. **User Deletion** (Step 8)
- **Issues #2, #3, #4**: FK SET NULL preservation
- Deletes user
- Verifies invoices still exist (not cascade deleted)
- Verifies commissions still exist
- Verifies audit logs still exist

### 10. **Decimal Precision** (Step 9)
- **Issue #11**: Commission calculation precision
- Tests fractional amounts: 333.33 × 20% = 66.67
- Tests standard amounts: 1000 × 15.50% = 155.00
- Tests penny rounding

### 11. **Timestamp Management** (Step 10)
- **Issue #5**: updated_at auto-management
- Verifies created_at and updated_at fields
- Updates invoice and checks timestamp changed
- Database trigger enforces accuracy

---

## Sample JSON Payloads

### Company
```json
{
  "name": "Test Corporation Inc",
  "email": "admin@testcorp.com",
  "phone": "+1-555-0100",
  "address": "123 Business Ave, Tech City, TC 12345"
}
```

### Customer
```json
{
  "company_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Acme Corporation",
  "email": "sales@acme.com",
  "phone": "+1-555-1000",
  "address": "999 Industrial Blvd, Factory City, FC 54321"
}
```

### User
```json
{
  "email": "salesperson@testcorp.com",
  "first_name": "Alice",
  "last_name": "Salesperson",
  "role": "sales"
}
```

### Company User (Assignment)
```json
{
  "company_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "abc12345-e89b-12d3-a456-426614174000",
  "commission_percent": "20.00"
}
```

### Invoice
```json
{
  "company_id": "123e4567-e89b-12d3-a456-426614174000",
  "customer_id": "xyz98765-e89b-12d3-a456-426614174000",
  "sold_by_user_id": "abc12345-e89b-12d3-a456-426614174000",
  "status": "draft",
  "total_amount": "0.00"
}
```

### Invoice Item
```json
{
  "invoice_id": "inv12345-e89b-12d3-a456-426614174000",
  "product_name": "Widget A",
  "quantity": "5.00",
  "unit_price": "100.00",
  "discount": "50.00",
  "total_amount": "450.00"
}
```

### Invoice Status Update (→ PAID triggers commission)
```json
{
  "status": "paid"
}
```

---

## Test Results Interpretation

### PASS ✓
- API endpoint responded with expected status code
- Data validation passed
- Business rule enforced correctly

### FAIL ✗
- API endpoint returned unexpected status
- Data validation failed
- Business rule not enforced

### Summary
```
Total Tests:  45
Passed:       45  
Failed:       0   
Pass Rate:    100.0%

✓ ALL TESTS PASSED!
```

---

## Color Coding

| Color | Meaning |
|-------|---------|
| 🟢 Green | Test Passed |
| 🔴 Red | Test Failed |
| 🟡 Yellow | Warning |
| 🔵 Blue | Section Header |
| 🔷 Cyan | Request/Response Details |

---

## Customization

### Change Backend URL
Edit the `BASE_URL` variable:

```python
BASE_URL = "http://127.0.0.1:8000"  # Change this
```

### Skip Specific Tests
Comment out test function calls in `main()`:

```python
def main():
    # ...
    company = test_company_crud()        # Keep
    # customer = test_customer_crud(company)  # Skip
    # ...
```

### Add Custom Tests
Create a new test function:

```python
def test_custom_feature():
    print_section("Custom Test")
    try:
        response = requests.get(f"{BASE_URL}/api/custom")
        if response.status_code == 200:
            stats.add_pass("Custom Test", "Success")
        else:
            stats.add_fail("Custom Test", f"Status {response.status_code}")
    except Exception as e:
        stats.add_fail("Custom Test", str(e))
```

Then call it in `main()`:

```python
test_custom_feature()
```

---

## Troubleshooting

### Connection Error
```
✗ FAIL - Backend Health Check
  Cannot connect to http://127.0.0.1:8000
```

**Solution**: Make sure your FastAPI/Flask backend is running:
```bash
python main.py
# or
uvicorn main:app --reload
```

### 404 Errors
```
✗ FAIL - CREATE Company
  Status 404
```

**Solution**: Verify endpoint paths match your API implementation:
- Check `/api/companies` exists
- Verify HTTP method is correct (POST, GET, PUT, DELETE)

### 400 Validation Errors
```
✗ FAIL - CREATE Company
  Status 400: {"error": "Missing field 'email'"}
```

**Solution**: Check JSON payload format matches your API schema

### Decimal Precision Failures
```
✗ FAIL - Commission Precision
  Mismatch: 150.001 ≠ 150.00
```

**Solution**: Ensure backend uses `Decimal(12,2)` not `Float`

---

## Reference: FastAPI Backend Example

See `api_backend_example.py` for a complete working FastAPI implementation with all endpoints and business logic.

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest requests
      
      - name: Start backend
        run: |
          python main.py &
          sleep 2
      
      - name: Run tests
        run: python api_test_suite.py
```

---

## Notes

- Tests are designed to run sequentially (later tests depend on earlier ones)
- Tests create real data in your database (use test database!)
- Some tests modify data (invoice status, user deletion)
- Total execution time: ~30-60 seconds depending on network latency

---

## Support

For issues or questions:
1. Check endpoint implementations match test expectations
2. Review error messages in test output
3. Verify database is running and accessible
4. Check response formats match expected JSON structure
