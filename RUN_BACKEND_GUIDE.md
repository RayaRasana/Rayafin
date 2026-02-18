# Backend Automation Script Guide

## Overview

`run_backend.py` is a comprehensive Python automation script that sets up and runs the **Rayafin RR-Accounting backend** with a single command. It handles all initialization, validation, and startup tasks automatically.

## Features

✅ **Python Version Validation** - Checks for Python 3.11 or 3.12  
✅ **Virtual Environment Setup** - Creates and configures `.venv`  
✅ **Dependency Management** - Installs packages with automatic Rust fallback  
✅ **Database Initialization** - Sets up PostgreSQL and applies schema  
✅ **Model Validation** - Runs comprehensive sanity tests  
✅ **FastAPI Startup** - Starts the development server automatically  
✅ **Error Recovery** - Graceful error handling with detailed logging  
✅ **Cross-Platform Support** - Works on Windows, Linux, and macOS  

## Prerequisites

### System Requirements
- **Python**: 3.11 or 3.12 (required)
- **PostgreSQL**: 12+ (must be installed and running)
- **Memory**: 2GB+ recommended
- **Disk Space**: 500MB for dependencies

### PostgreSQL Setup
Before running the script, ensure PostgreSQL is installed and running:

**Windows:**
```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# Or install via chocolatey
choco install postgresql
```

**Linux:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Environment Configuration
Create or verify `.env` file in the workspace root:

```ini
# PostgreSQL Database Configuration
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rr_accounting

# Connection pool settings
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_RECYCLE=3600

# Logging
DB_ECHO=false
```

## Quick Start

### 1. Basic Usage
```bash
cd c:\Users\barba\Documents\GitHub\Rayafin
python run_backend.py
```

### 2. Expected Output Flow

```
======================================================================
  RR-Accounting Backend Automation
======================================================================

======================================================================
  Step 1: Checking Python Version
======================================================================
ℹ Current Python version: 3.11.7
✓ Python 3.11.7 is compatible

======================================================================
  Step 2: Setting Up Virtual Environment
======================================================================
ℹ Creating virtual environment at .venv
✓ Virtual environment created successfully
✓ Virtual environment is ready at .venv

======================================================================
  Step 3: Installing Dependencies
======================================================================
...

======================================================================
  Step 4: Setting Up Database
======================================================================
...

======================================================================
  Step 5: Running Model Sanity Tests
======================================================================
✓ All models imported successfully
✓ Company created: <Company(id=1, name=Test Company Inc.)>
✓ User created: <User(id=1, email=test@example.com, active=True)>
...

======================================================================
  Step 6: Starting FastAPI Backend
======================================================================
✓ FastAPI server started successfully!
🎉 Backend is ready and running at http://127.0.0.1:8000
```

### 3. Verify Server Running
Once the server starts, you can access:

- **API Base**: http://127.0.0.1:8000
- **Swagger UI Docs**: http://127.0.0.1:8000/docs
- **ReDoc Documentation**: http://127.0.0.1:8000/redoc

## Step-by-Step Breakdown

### Step 1: Python Version Check
- Validates Python version is 3.11 or 3.12
- Exits with helpful message if incompatible version found

### Step 2: Virtual Environment
- Creates `.venv` directory if it doesn't exist
- Uses Python's built-in `venv` module
- Detects correct pip executable path for Windows/Linux/macOS

### Step 3: Dependency Installation
- Reads `requirements.txt`
- Installs each package using pip
- **Rust Fallback**: If a package requires Rust compilation:
  - Automatically detects the error
  - Installs Rust via winget (Windows), curl (Linux/macOS)
  - Retries the package installation
  - Continues if Rust installation fails

### Step 4: Database Setup
- Loads PostgreSQL credentials from `.env`
- Connects to PostgreSQL default database
- Creates target database if it doesn't exist
- Parses and applies `schema_corrected.sql`
- Handles duplicate objects gracefully (already exists errors)

### Step 5: Model Sanity Tests
Creates a temporary test script that:

1. **Imports all models** - Validates ORM model definitions
2. **Creates database tables** - Using SQLAlchemy ORM
3. **Tests Company** - Creates test company entity
4. **Tests User** - Creates user with password hashing
5. **Tests CompanyUser** - Validates multi-tenant relationships
6. **Tests Customer** - Creates customer entity
7. **Tests Invoice** - Creates invoice with items
8. **Tests Commission Snapshot** - Verifies commission creation on PAID status
9. **Tests Audit Logging** - Verifies audit trail functionality

All test data is committed to demonstrate full workflow.

### Step 6: FastAPI Server
- Starts uvicorn development server
- Listens on `127.0.0.1:8000`
- Runs with `--reload` for auto-restart on code changes
- Stays running for manual testing
- Press **Ctrl+C** to gracefully shutdown

## Troubleshooting

### Issue: "Python X.Y not found"
**Solution**: Install Python 3.11 or 3.12 from [python.org](https://www.python.org)

### Issue: PostgreSQL Connection Failed
**Symptoms**:
```
✗ Failed to create database: connection refused
```

**Solutions**:
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   Get-Service postgresql*
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Check credentials in `.env` file

3. Test connection manually:
   ```bash
   psql -U postgres -h localhost -p 5432
   ```

### Issue: "psycopg not available"
**Symptoms**:
```
✗ psycopg not available, database setup will be skipped
```

**Solution**: Wait for pip installations to complete, as psycopg is installed in Step 3

### Issue: Rust Compilation Error
**Symptoms**:
```
⚠ Rust compilation required for psycopg
```

**Solution**: Script attempts automatic Rust installation. If manual installation needed:

**Windows**:
```powershell
winget install Rustlang.Rust.MSVCMsvcInstall -e
```

**Linux/macOS**:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Issue: Virtual Environment Activation Failed
**Solution**: Delete `.venv` and rerun script:
```bash
Remove-Item -Recurse .venv
python run_backend.py
```

### Issue: "Module not found" errors in sanity tests
**Solution**: 
1. Verify all imports in `backend/app/models.py`
2. Check `requirements.txt` has all dependencies
3. Ensure backend structure is correct:
   ```
   backend/
   ├── __init__.py
   ├── app/
   │   ├── __init__.py
   │   ├── main.py
   │   └── models.py
   ```

## Advanced Options

### Manual Environment Activation
If you want to work in the environment separately:

**Windows PowerShell:**
```powershell
.\.venv\Scripts\Activate.ps1
```

**Windows CMD:**
```cmd
.venv\Scripts\activate.bat
```

**Linux/macOS:**
```bash
source .venv/bin/activate
```

### Running Backend Manually
Once environment is set up:

```bash
# Activate venv first
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows

# Start server
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### Database Debugging
```bash
# Connect to database
psql -U postgres -h localhost -d rr_accounting

# View tables
\dt

# View specific table
\d companies

# Run query
SELECT * FROM companies;
```

### Running Sanity Tests Separately
```bash
# Activate environment
source .venv/bin/activate

# Run models directly
python -m backend.app.models
```

## Configuration Details

### requirements.txt Packages
- `sqlalchemy==2.0.46` - ORM database layer
- `psycopg[binary]==3.3.2` - PostgreSQL driver
- `fastapi==0.104.1` - Web framework
- `uvicorn==0.24.0` - ASGI server
- `pydantic==2.5.0` - Data validation
- `bcrypt==4.1.1` - Password hashing
- `python-dotenv==1.0.0` - Environment configuration
- `requests==2.31.0` - HTTP client

### Database Schema
Key tables created:
- `companies` - Tenants/organizations
- `users` - System users
- `company_users` - User-company relationships with roles
- `customers` - Customer entities per company
- `invoices` - Invoice documents
- `invoice_items` - Line items on invoices
- `commissions` - Commission records with snapshots
- `audit_logs` - Comprehensive audit trail

### Decimal Precision
All monetary fields use:
- **Type**: `NUMERIC(12,2)` in PostgreSQL
- **Python**: `Decimal` type for accurate arithmetic
- **Rounding**: `ROUND_HALF_UP` for financial operations

## Performance Considerations

- **Connection Pool**: Configured with `DB_POOL_SIZE=10` for concurrent requests
- **Indexes**: Strategic indexes on company_id, status, created_at for query optimization
- **Cascade Rules**: Deletes cascade appropriately for data integrity
- **Session Management**: Automatic session cleanup in dependency injection

## Security Notes

- **Multi-Tenant Isolation**: All operational tables include `company_id` for data segregation
- **Row-Level Security (RLS)**: Database supports RLS policies for additional isolation
- **Password Hashing**: bcrypt with proper salt generation
- **Audit Trail**: All CRUD operations logged with user context
- **Input Validation**: Pydantic models validate all API inputs

## Logging

The script logs:
- ✓ Successful operations (green check)
- ⚠ Warnings (cautions, non-critical issues)
- ✗ Errors (failures with details)
- ℹ Informational messages (progress, details)

All errors are printed with:
- Clear description of what failed
- Context about where failure occurred
- Suggestions for resolution when applicable

## Support

For issues or questions:
1. Check the **Troubleshooting** section above
2. Review output logs for the specific error message
3. Verify PostgreSQL is running and credentials are correct
4. Ensure Python version is 3.11 or 3.12
5. Delete `.venv` and rerun script to reset environment

## Notes

- **Development Mode**: Server runs with `--reload` for auto-refresh on code changes
- **Open Database Connection**: Leaves PostgreSQL connection open for server duration
- **Test Data**: Sanity test data persists in database (can be manually cleaned)
- **Port**: Uses standard port 8000 (change in main.py if needed)
- **Graceful Shutdown**: Press Ctrl+C to stop server cleanly

---

**Last Updated**: February 18, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
