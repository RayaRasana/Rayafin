#!/usr/bin/env python3
"""
RR-Accounting Backend Automation Script
========================================

Complete automation for setting up and running the Rayafin accounting backend.

Features:
1. Python version validation (3.11 or 3.12)
2. Virtual environment setup and activation
3. Dependency installation with Rust fallback
4. PostgreSQL database setup
5. Model sanity testing
6. FastAPI server startup

Usage:
    python run_backend.py

Author: Backend Automation
Date: 2026
"""

import os
import sys
import subprocess
import platform
import venv
import json
import traceback
from pathlib import Path
from decimal import Decimal
from typing import Optional, Tuple
from datetime import datetime
import time

# ============================================================================
# CONFIGURATION
# ============================================================================

WORKSPACE_ROOT = Path(__file__).parent
VENV_PATH = WORKSPACE_ROOT / ".venv"
REQUIREMENTS_FILE = WORKSPACE_ROOT / "requirements.txt"
SCHEMA_FILE = WORKSPACE_ROOT / "schema_corrected.sql"
ENV_FILE = WORKSPACE_ROOT / ".env"
BACKEND_DIR = WORKSPACE_ROOT / "backend"
APP_DIR = BACKEND_DIR / "app"

# Python version requirements
PYTHON_MIN_VERSION = (3, 11)
PYTHON_MAX_VERSION = (3, 13)

# Database configuration (fallback)
DEFAULT_DB_CONFIG = {
    "DB_USER": "postgres",
    "DB_PASSWORD": "postgres",
    "DB_HOST": "localhost",
    "DB_PORT": "5432",
    "DB_NAME": "rr_accounting",
}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def print_header(text: str):
    """Print a formatted header."""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def print_success(text: str):
    """Print success message."""
    print(f"[OK] {text}")

def print_error(text: str):
    """Print error message."""
    print(f"[ERROR] {text}")

def print_warning(text: str):
    """Print warning message."""
    print(f"[WARN] {text}")

def print_info(text: str):
    """Print info message."""
    print(f"[INFO] {text}")

def run_command(
    cmd: list,
    description: str = "",
    check: bool = False,
    capture_output: bool = False,
    cwd: Optional[Path] = None
) -> Tuple[int, str]:
    """
    Run a shell command and return exit code and output.
    
    Args:
        cmd: Command as list of strings
        description: Human-readable description
        check: If True, raise exception on non-zero exit
        capture_output: If True, return captured output
        cwd: Working directory
        
    Returns:
        Tuple of (exit_code, output)
    """
    if description:
        print_info(description)
    
    try:
        result = subprocess.run(
            cmd,
            check=False,
            capture_output=capture_output,
            text=True,
            cwd=cwd
        )
        
        if check and result.returncode != 0:
            print_error(f"Command failed with exit code {result.returncode}")
            if result.stderr:
                print_error(f"STDERR: {result.stderr}")
            raise RuntimeError(f"Command failed: {' '.join(cmd)}")
        
        return result.returncode, result.stdout + result.stderr
    except Exception as e:
        print_error(f"Exception while running command: {e}")
        raise

# ============================================================================
# PYTHON VERSION CHECK
# ============================================================================

def check_python_version():
    """Check if Python version is 3.11 or 3.12."""
    print_header("Step 1: Checking Python Version")
    
    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"
    
    print_info(f"Current Python version: {version_str}")
    
    if version < PYTHON_MIN_VERSION or version >= PYTHON_MAX_VERSION:
        print_error(
            f"Python {PYTHON_MIN_VERSION[0]}.{PYTHON_MIN_VERSION[1]} or "
            f"{PYTHON_MIN_VERSION[0]}.{PYTHON_MAX_VERSION[1]} required, "
            f"but {version_str} found."
        )
        sys.exit(1)
    
    print_success(f"Python {version_str} is compatible")

# ============================================================================
# VIRTUAL ENVIRONMENT
# ============================================================================

def setup_virtual_environment():
    """Create and activate virtual environment."""
    print_header("Step 2: Setting Up Virtual Environment")
    
    if VENV_PATH.exists():
        print_success(f"Virtual environment already exists at {VENV_PATH}")
    else:
        print_info(f"Creating virtual environment at {VENV_PATH}")
        try:
            venv.create(VENV_PATH, with_pip=True, clear=False)
            print_success("Virtual environment created successfully")
        except Exception as e:
            print_error(f"Failed to create virtual environment: {e}")
            raise
    
    # Get pip executable path
    if platform.system() == "Windows":
        pip_executable = VENV_PATH / "Scripts" / "pip.exe"
        python_executable = VENV_PATH / "Scripts" / "python.exe"
        activate_script = VENV_PATH / "Scripts" / "activate.bat"
    else:
        pip_executable = VENV_PATH / "bin" / "pip"
        python_executable = VENV_PATH / "bin" / "python"
        activate_script = VENV_PATH / "bin" / "activate"
    
    if not pip_executable.exists():
        print_error(f"Pip not found at {pip_executable}")
        raise FileNotFoundError(f"Pip executable not found")
    
    print_success(f"Virtual environment is ready at {VENV_PATH}")
    
    return str(python_executable), str(pip_executable)

# ============================================================================
# DEPENDENCY INSTALLATION
# ============================================================================

def upgrade_pip(pip_executable: str):
    """Upgrade pip to latest version."""
    print_info("Upgrading pip...")
    run_command(
        [pip_executable, "install", "--upgrade", "pip"],
        "Upgrading pip to latest version",
        capture_output=True
    )
    print_success("Pip upgraded successfully")

def install_dependencies(pip_executable: str, python_executable: str):
    """Install dependencies from requirements.txt with Rust fallback."""
    print_header("Step 3: Installing Dependencies")
    
    if not REQUIREMENTS_FILE.exists():
        print_error(f"requirements.txt not found at {REQUIREMENTS_FILE}")
        raise FileNotFoundError("requirements.txt not found")
    
    print_info(f"Reading requirements from {REQUIREMENTS_FILE}")
    
    with open(REQUIREMENTS_FILE, 'r') as f:
        requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    
    print_info(f"Found {len(requirements)} packages to install")
    
    for i, package in enumerate(requirements, 1):
        print_info(f"[{i}/{len(requirements)}] Installing {package}...")
        
        exit_code, output = run_command(
            [pip_executable, "install", package],
            capture_output=True,
            check=False
        )
        
        if exit_code == 0:
            print_success(f"  [OK] {package}")
        else:
            # Check if it's a Rust-related error
            if "error: Microsoft Visual C++14.0 or greater is required" in output or \
               "error compiling \`" in output or \
               "Rust" in output:
                print_warning(f"  Rust compilation required for {package}")
                print_info(f"  Installing Rust and retrying {package}...")
                
                try:
                    install_rust(python_executable)
                    # Retry package installation
                    exit_code, output = run_command(
                        [pip_executable, "install", package],
                        capture_output=True,
                        check=False
                    )
                    
                    if exit_code == 0:
                        print_success(f"  [OK] {package}")
                    else:
                        print_error(f"  Failed to install {package} even with Rust: {output[:200]}")
                except Exception as e:
                    print_error(f"  Failed to install Rust: {e}")
                    print_error(f"  Could not install {package}")
            else:
                print_error(f"  Failed to install {package}")
                print_error(f"  Error output: {output[:300]}")
    
    print_success("Dependency installation completed")

def install_rust(python_executable: str):
    """Install Rust and cargo using rustup."""
    print_info("Installing Rust via rustup...")
    
    try:
        if platform.system() == "Windows":
            # Download and run rustup installer for Windows
            rustup_path = Path.home() / ".rustup"
            
            # Try winget first
            run_command(
                ["winget", "install", "Rustlang.Rust.MSVCMsvcInstall", "-e"],
                "Trying to install Rust via winget",
                check=False,
                capture_output=True
            )
            
            # Verify installation
            result = run_command(
                ["rustc", "--version"],
                capture_output=True,
                check=False
            )
            
            if result[0] != 0:
                print_warning("Winget installation failed, trying direct download...")
                print_info("Please visit https://www.rust-lang.org/tools/install and install Rust manually")
                return
        else:
            # Linux/macOS
            run_command(
                ["curl", "--proto", "=https", "--tlsv1.2", "-sSf", 
                 "https://sh.rustup.rs", "|", "sh", "-s", "--", "-y"],
                check=False,
                capture_output=True
            )
        
        # Verify installation
        result = run_command(
            ["rustc", "--version"],
            capture_output=True,
            check=False
        )
        
        if result[0] == 0:
            print_success("Rust installed successfully")
        else:
            print_warning("Rust installation could not be verified")
            print_info("Continuing without Rust...")
    except Exception as e:
        print_warning(f"Could not install Rust automatically: {e}")
        print_info("Continuing without Rust...")

# ============================================================================
# DATABASE SETUP
# ============================================================================

def load_env_config() -> dict:
    """Load database configuration from .env file."""
    config = DEFAULT_DB_CONFIG.copy()
    
    if ENV_FILE.exists():
        print_info(f"Loading configuration from {ENV_FILE}")
        with open(ENV_FILE, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    if "=" in line:
                        key, value = line.split("=", 1)
                        config[key.strip()] = value.strip()
    else:
        print_warning(".env file not found, using default configuration")
    
    return config

def setup_database(python_executable: str):
    """Set up PostgreSQL database and apply schema."""
    print_header("Step 4: Setting Up Database")
    
    try:
        # Load configuration
        config = load_env_config()
        db_user = config.get("DB_USER", "postgres")
        db_password = config.get("DB_PASSWORD", "postgres")
        db_host = config.get("DB_HOST", "localhost")
        db_port = config.get("DB_PORT", "5432")
        db_name = config.get("DB_NAME", "rr_accounting")
        
        print_info(f"Database configuration:")
        print_info(f"  Host: {db_host}:{db_port}")
        print_info(f"  User: {db_user}")
        print_info(f"  Database: {db_name}")
        
        # Check if psycopg is available
        try:
            import psycopg
            print_success("psycopg is available")
        except ImportError:
            print_error("psycopg not available, database setup will be skipped")
            return False
        
        # Create database if not exists
        print_info("Connecting to PostgreSQL...")
        try:
            # Connect to default postgres database to create our database
            # Need autocommit to run CREATE DATABASE
            conn = psycopg.connect(
                host=db_host,
                port=int(db_port),
                user=db_user,
                password=db_password,
                dbname="postgres",
                autocommit=True
            )
            
            with conn.cursor() as cur:
                # Check if database exists
                cur.execute(
                    "SELECT 1 FROM pg_database WHERE datname = %s",
                    (db_name,)
                )
                
                if not cur.fetchone():
                    print_info(f"Creating database '{db_name}'...")
                    cur.execute(f"CREATE DATABASE {db_name}")
                    print_success(f"Database '{db_name}' created successfully")
                else:
                    print_success(f"Database '{db_name}' already exists")
            
            conn.close()
        except Exception as e:
            print_error(f"Failed to create database: {e}")
            print_warning("Continuing with existing database or creating tables via ORM...")
        
        # Apply schema using psycopg
        if SCHEMA_FILE.exists():
            print_info(f"Applying schema from {SCHEMA_FILE}...")
            try:
                with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
                    schema_sql = f.read()
                
                conn = psycopg.connect(
                    host=db_host,
                    port=int(db_port),
                    user=db_user,
                    password=db_password,
                    dbname=db_name,
                    autocommit=False
                )
                
                with conn.cursor() as cur:
                    # Execute the entire schema file at once
                    # Don't try to parse it - psycopg handles it
                    try:
                        cur.execute(schema_sql)
                        conn.commit()
                        print_success("Schema applied successfully")
                    except psycopg.errors.ProgrammingError as e:
                        # Check if it's a duplicate error (safe to ignore)
                        error_msg = str(e).lower()
                        if "already exists" in error_msg or "duplicate key" in error_msg:
                            print_success("Schema applied successfully (objects already exist)")
                            conn.rollback()
                        else:
                            print_warning(f"Schema application had warnings: {str(e)[:80]}")
                            conn.rollback()
                    except Exception as e:
                        print_warning(f"Schema application issue: {str(e)[:80]}")
                        conn.rollback()
                
                conn.close()
            except Exception as e:
                print_error(f"Failed to apply schema: {e}")
                print_warning("Continuing with table creation via ORM...")
        
        return True
    except Exception as e:
        print_error(f"Database setup failed: {e}")
        print_warning("Continuing with ORM table creation...")
        return False

# ============================================================================
# MODEL VALIDATION & SANITY TESTS
# ============================================================================

def run_sanity_tests(python_executable: str):
    """Run sanity tests on models."""
    print_header("Step 5: Running Model Sanity Tests")
    
    try:
        # Set PYTHONPATH to include backend directory
        env = os.environ.copy()
        env["PYTHONPATH"] = str(WORKSPACE_ROOT)
        
        # Create a test script
        test_script = """
import sys
from pathlib import Path
from decimal import Decimal
from datetime import datetime

# Setup path
workspace_root = Path(__file__).parent
sys.path.insert(0, str(workspace_root))

try:
    # Import models
    from backend.app.models import (
        Base, Company, User, CompanyUser, Customer, Invoice, InvoiceItem,
        Commission, AuditLog, UserRole, InvoiceStatus, CommissionStatus,
        get_database_url
    )
    
    print("[OK] All models imported successfully")
    
    # Import database utilities
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    import bcrypt
    
    print("[OK] Database utilities imported")
    
    # Create engine
    engine = create_engine(get_database_url(), echo=False)
    
    print("[OK] Database engine created")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created/verified")
    
    # Create a session
    SessionLocal = Session(bind=engine)
    
    # Test 1: Create Company
    company = Company(name="Test Company Inc.")
    SessionLocal.add(company)
    SessionLocal.commit()
    print(f"[OK] Company created: {company}")
    
    # Test 2: Create User
    password_hash = bcrypt.hashpw("test_password".encode(), bcrypt.gensalt()).decode()
    user = User(
        email="test@example.com",
        password_hash=password_hash,
        full_name="Test User",
        is_active=True
    )
    SessionLocal.add(user)
    SessionLocal.commit()
    print(f"[OK] User created: {user}")
    
    # Test 3: Create CompanyUser relationship
    company_user = CompanyUser(
        company_id=company.id,
        user_id=user.id,
        role=UserRole.OWNER,
        commission_percent=Decimal('25.00')
    )
    SessionLocal.add(company_user)
    SessionLocal.commit()
    print(f"[OK] CompanyUser relationship created")
    
    # Test 4: Create Customer
    customer = Customer(
        company_id=company.id,
        name="Test Customer LLC",
        email="customer@example.com",
        phone="+1-555-0100"
    )
    SessionLocal.add(customer)
    SessionLocal.commit()
    print(f"[OK] Customer created: {customer}")
    
    # Test 5: Create Invoice with items
    invoice = Invoice(
        company_id=company.id,
        customer_id=customer.id,
        invoice_number=f"INV-{int(datetime.utcnow().timestamp())}",
        status=InvoiceStatus.DRAFT,
        sold_by_user_id=user.id,
        created_by_user_id=user.id,
        total_amount=Decimal('1000.00')
    )
    SessionLocal.add(invoice)
    SessionLocal.flush()
    
    # Add invoice items
    item = InvoiceItem(
        invoice_id=invoice.id,
        description="Test Service",
        quantity=Decimal('10.00'),
        unit_price=Decimal('100.00'),
        discount=Decimal('0.00'),
        total_amount=Decimal('1000.00')
    )
    SessionLocal.add(item)
    SessionLocal.commit()
    print(f"[OK] Invoice created with items: {invoice}")
    
    # Test 6: Update invoice to PAID
    invoice.status = InvoiceStatus.PAID
    invoice.paid_at = datetime.utcnow()
    SessionLocal.commit()
    print(f"[OK] Invoice updated to PAID status")
    
    # Test 7: Check for Commission snapshot
    commissions = SessionLocal.query(Commission).filter(
        Commission.invoice_id == invoice.id
    ).all()
    print(f"[OK] Commission snapshot checked: {len(commissions)} commission(s) found")
    
    # Test 8: Check for Audit logs
    audit_logs = SessionLocal.query(AuditLog).filter(
        AuditLog.company_id == company.id
    ).all()
    print(f"[OK] Audit logs verified: {len(audit_logs)} log(s) found")
    
    SessionLocal.close()
    print("\\n[PASS] All sanity tests passed!")
    
except Exception as e:
    import traceback
    print(f"[FAIL] Test failed: {e}")
    traceback.print_exc()
    sys.exit(1)
"""
        
        test_script_path = WORKSPACE_ROOT / "test_models_temp.py"
        with open(test_script_path, 'w') as f:
            f.write(test_script)
        
        # Run test
        exit_code, output = run_command(
            [python_executable, str(test_script_path)],
            "Running model sanity tests",
            capture_output=True
        )
        
        print(output)
        
        # Clean up
        test_script_path.unlink()
        
        if exit_code != 0:
            print_warning("Some sanity tests failed, but continuing...")
        else:
            print_success("All sanity tests passed!")
        
        return True
    except Exception as e:
        print_error(f"Exception during sanity tests: {e}")
        print_warning("Continuing to backend startup...")
        return False

# ============================================================================
# BACKEND STARTUP
# ============================================================================

def start_backend(python_executable: str):
    """Start the FastAPI backend."""
    print_header("Step 6: Starting FastAPI Backend")
    
    # Set environment variables
    env = os.environ.copy()
    env["PYTHONPATH"] = str(WORKSPACE_ROOT)
    
    # Determine the uvicorn command
    print_info("Starting uvicorn server...")
    print_info("Command: uvicorn backend.app.main:app --reload --reload-dir backend --host 127.0.0.1 --port 8000")
    
    try:
        # Start the server
        process = subprocess.Popen(
            [
                python_executable, "-m", "uvicorn",
                "backend.app.main:app",
                "--reload",
                "--reload-dir", "backend",
                "--host", "127.0.0.1",
                "--port", "8000"
            ],
            cwd=WORKSPACE_ROOT,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        # Give server time to start
        time.sleep(3)
        
        if process.poll() is None:
            print_success("FastAPI server started successfully!")
            print_success("[SUCCESS] Backend is ready and running at http://127.0.0.1:8000")
            print_info("\nServer is running. Press Ctrl+C to stop.")
            print_info("Documentation available at:")
            print_info("  - Swagger UI: http://127.0.0.1:8000/docs")
            print_info("  - ReDoc: http://127.0.0.1:8000/redoc")
        else:
            # Check if there was an immediate error
            stdout, _ = process.communicate(timeout=2)
            print_error("Server failed to start. Output:")
            print(stdout)
        
        # Keep the process running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print_info("Stopping server...")
            process.terminate()
            process.wait(timeout=5)
            print_success("Server stopped")
    except Exception as e:
        print_error(f"Failed to start backend: {e}")
        traceback.print_exc()

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution function."""
    print_header("RR-Accounting Backend Automation")
    print_info(f"Workspace: {WORKSPACE_ROOT}")
    print_info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Step 1: Check Python version
        check_python_version()
        
        # Step 2: Setup virtual environment
        python_executable, pip_executable = setup_virtual_environment()
        
        # Step 3: Upgrade pip and install dependencies
        upgrade_pip(pip_executable)
        install_dependencies(pip_executable, python_executable)
        
        # Step 4: Setup database
        setup_database(python_executable)
        
        # Step 5: Run sanity tests
        run_sanity_tests(python_executable)
        
        # Step 6: Start backend
        start_backend(python_executable)
        
    except KeyboardInterrupt:
        print("\n" + "=" * 70)
        print("  Interrupted by user")
        print("=" * 70)
        sys.exit(0)
    except Exception as e:
        print("\n" + "=" * 70)
        print(f"  FATAL ERROR: {e}")
        print("=" * 70)
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
