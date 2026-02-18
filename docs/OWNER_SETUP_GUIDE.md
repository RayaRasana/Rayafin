# Owner Setup Quick Guide

## Create Complete Owner Setup

The `setup_owner.py` script creates everything you need to get started:
- ✅ Company
- ✅ Owner user account  
- ✅ Owner role assignment
- ✅ Commission setup

## Usage

### Interactive Mode (Recommended)

```bash
python setup_owner.py
```

This will prompt you for:
1. Company name
2. Owner full name
3. Owner email
4. Owner password
5. Commission percentage (optional, default: 20%)

### Command-Line Mode

```bash
python setup_owner.py "شرکت رایافین" "admin@rayafin.com" "SecurePass123" "علی احمدی" 25.0
```

**Arguments:**
1. Company name
2. Owner email
3. Owner password
4. Owner full name
5. Commission percentage (optional, default: 20%)

## Examples

### Example 1: Create First Company Owner

```bash
python setup_owner.py
```

**Input:**
```
Enter company name: شرکت رایافین
Enter owner full name: علی احمدی
Enter owner email: admin@rayafin.com
Enter owner password: MySecurePass123
Enter commission percentage (default: 20.0): 25
```

**Output:**
```
======================================================================
  Setup Complete!
======================================================================
[OK] Company: شرکت رایافین (ID: 1)
[OK] Owner: علی احمدی <admin@rayafin.com> (ID: 1)
[OK] Role: OWNER
[OK] Commission: 25.0%

[INFO] Login credentials:
  Email: admin@rayafin.com
  Password: MySecurePass123
======================================================================
```

### Example 2: Add Owner to Existing Company

If the company already exists, the script will:
- Use the existing company
- Create a new user (if needed)
- Assign OWNER role

### Example 3: Quick Setup via Command Line

```bash
# Persian example
python setup_owner.py "شرکت تجارت الکترونیک" "owner@shop.com" "Pass1234" "محمد رضایی" 20

# English example  
python setup_owner.py "Rayafin Accounting" "owner@rayafin.com" "Admin123" "Ali Ahmadi" 15
```

## What Gets Created

### 1. Company Record
```
companies table:
  - id: auto-generated
  - name: your company name
  - created_at: timestamp
  - updated_at: timestamp
```

### 2. User Record
```
users table:
  - id: auto-generated
  - email: owner email
  - password_hash: bcrypt hashed password
  - full_name: owner name
  - is_active: true
  - created_at: timestamp
  - updated_at: timestamp
```

### 3. Company-User Relationship
```
company_users table:
  - company_id: link to company
  - user_id: link to user
  - role: OWNER
  - commission_percent: your percentage
  - created_at: timestamp
  - updated_at: timestamp
```

## After Setup

### Login to the System

Use the credentials you created:
- **Email**: The email you provided
- **Password**: The password you provided

### Owner Permissions

As an OWNER, you have full access to:
- ✅ Create/Edit/Delete Companies
- ✅ Manage Users
- ✅ Create/Edit/Delete Customers
- ✅ Create/Edit/Delete Products
- ✅ Create/Edit/Delete/Lock Invoices
- ✅ Approve Commissions
- ✅ Mark Commissions as Paid
- ✅ View Audit Logs
- ✅ Import Products from CSV/XLSX

### Next Steps

1. **Start Backend**:
   ```bash
   uvicorn backend.app.main:app --reload
   ```

2. **Start Frontend** (in another terminal):
   ```bash
   cd frontend
   npm start
   ```

3. **Login** at: http://localhost:3000/login

4. **Add More Users**:
   - Go to Users page
   - Click "Add User"
   - Assign roles: OWNER, ACCOUNTANT, or SALES

5. **Add Customers**:
   - Go to Customers page
   - Click "Add Customer"

6. **Add Products**:
   - Go to Products page
   - Click "Add Product" or "Import from File"

## Troubleshooting

### "User already exists"
The script will use the existing user and just update the company relationship.

### "Company already exists"  
The script will use the existing company and create the owner relationship.

### Password Requirements
- Minimum 6 characters (recommended: 8+)
- Use mix of letters, numbers, and symbols

### Commission Percentage
- Must be between 0 and 100
- Default is 20% if not specified
- Can be changed later in the database

## Security Notes

⚠️ **Important Security Practices:**
- Use strong passwords (8+ characters, mixed case, numbers, symbols)
- Don't share credentials in public repositories
- Change default passwords in production
- Use HTTPS in production
- Enable Row-Level Security (RLS) for production databases

## Database Requirements

Make sure you've run the database setup first:
```bash
python setup_database.py
```

This creates all 9 tables needed for the application.
