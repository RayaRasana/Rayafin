#!/usr/bin/env python3
"""
Database Setup Script for RR-Accounting
Creates the database and applies the schema
"""

import sys
import psycopg
from psycopg import sql
import os
from pathlib import Path

# Database configuration
DB_USER = "postgres"
DB_PASSWORD = "postgres"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "rr_accounting"
SCHEMA_FILE = "schema_corrected.sql"

def create_database():
    """Create the database if it doesn't exist"""
    print(f"\n{'='*70}")
    print(f"  Creating Database: {DB_NAME}")
    print(f"{'='*70}")
    
    # Connect to the default 'postgres' database to create our database
    conn_string = f"host={DB_HOST} port={DB_PORT} user={DB_USER} password={DB_PASSWORD} dbname=postgres"
    
    try:
        print(f"[INFO] Connecting to PostgreSQL server at {DB_HOST}:{DB_PORT}...")
        with psycopg.connect(conn_string, autocommit=True) as conn:
            with conn.cursor() as cur:
                # Check if database exists
                cur.execute(
                    "SELECT 1 FROM pg_database WHERE datname = %s",
                    (DB_NAME,)
                )
                exists = cur.fetchone()
                
                if exists:
                    print(f"[WARN] Database '{DB_NAME}' already exists")
                    response = input("Do you want to drop and recreate it? (yes/no): ").lower()
                    if response == 'yes':
                        print(f"[INFO] Dropping existing database '{DB_NAME}'...")
                        # Terminate existing connections
                        cur.execute(f"""
                            SELECT pg_terminate_backend(pg_stat_activity.pid)
                            FROM pg_stat_activity
                            WHERE pg_stat_activity.datname = '{DB_NAME}'
                            AND pid <> pg_backend_pid()
                        """)
                        cur.execute(sql.SQL("DROP DATABASE {}").format(
                            sql.Identifier(DB_NAME)
                        ))
                        print(f"[OK] Dropped existing database")
                    else:
                        print("[INFO] Skipping database creation")
                        return False
                
                # Create the database
                print(f"[INFO] Creating database '{DB_NAME}'...")
                cur.execute(sql.SQL("CREATE DATABASE {}").format(
                    sql.Identifier(DB_NAME)
                ))
                print(f"[OK] Database '{DB_NAME}' created successfully!")
                return True
                
    except psycopg.Error as e:
        print(f"[ERROR] Failed to create database: {e}")
        return False

def apply_schema():
    """Apply the schema from schema_corrected.sql"""
    print(f"\n{'='*70}")
    print(f"  Applying Database Schema")
    print(f"{'='*70}")
    
    schema_path = Path(__file__).parent / SCHEMA_FILE
    
    if not schema_path.exists():
        print(f"[ERROR] Schema file not found: {schema_path}")
        return False
    
    print(f"[INFO] Reading schema from {SCHEMA_FILE}...")
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    
    # Connect to the newly created database
    conn_string = f"host={DB_HOST} port={DB_PORT} user={DB_USER} password={DB_PASSWORD} dbname={DB_NAME}"
    
    try:
        print(f"[INFO] Connecting to database '{DB_NAME}'...")
        with psycopg.connect(conn_string) as conn:
            with conn.cursor() as cur:
                print(f"[INFO] Executing schema SQL...")
                cur.execute(schema_sql)
                conn.commit()
                print(f"[OK] Schema applied successfully!")
                
                # Verify tables were created
                cur.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_type = 'BASE TABLE'
                    ORDER BY table_name
                """)
                tables = cur.fetchall()
                
                if tables:
                    print(f"\n[OK] Created {len(tables)} tables:")
                    for table in tables:
                        print(f"  ✓ {table[0]}")
                else:
                    print("[WARN] No tables found after schema application")
                
                return True
                
    except psycopg.Error as e:
        print(f"[ERROR] Failed to apply schema: {e}")
        return False

def main():
    """Main execution"""
    print(f"\n{'='*70}")
    print(f"  RR-Accounting Database Setup")
    print(f"{'='*70}")
    print(f"[INFO] Target Database: {DB_NAME}")
    print(f"[INFO] PostgreSQL Server: {DB_HOST}:{DB_PORT}")
    print(f"[INFO] Schema File: {SCHEMA_FILE}")
    
    # Step 1: Create database
    if not create_database():
        print("\n[INFO] Database setup cancelled or failed")
        return 1
    
    # Step 2: Apply schema
    if not apply_schema():
        print("\n[ERROR] Schema application failed")
        return 1
    
    print(f"\n{'='*70}")
    print(f"  Database Setup Complete!")
    print(f"{'='*70}")
    print(f"[OK] Database '{DB_NAME}' is ready to use")
    print(f"[INFO] You can now run the backend server with: py -3.11 run_backend.py")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
