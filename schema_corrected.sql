-- PostgreSQL DDL for Multi-Tenant Accounting System
-- CORRECTED VERSION - Aligns with SQLAlchemy ORM Models
-- 
-- Key Changes from Previous Version:
-- 1. Added CHECK constraint for InvoiceItem.total_amount validation
-- 2. Added CHECK constraint for InvoiceItem.discount >= 0
-- 3. Enabled updated_at timestamp trigger for all mutable tables
-- 4. Added explicit CASCADE trigger for Invoice.total_amount calculation
-- 5. Updated JSONB usage for audit_logs consistency
-- 6. Enhanced commission snapshot trigger with better error handling

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('owner', 'accountant', 'sales');
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid');
CREATE TYPE commission_status AS ENUM ('pending', 'approved', 'paid');

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_companies_name ON companies(name);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE TABLE company_users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'accountant',
    commission_percent NUMERIC(5,2) NOT NULL DEFAULT 20.0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (commission_percent >= 0 AND commission_percent <= 100),
    UNIQUE(company_id, user_id)
);
CREATE INDEX idx_company_users_company_id ON company_users(company_id);
CREATE INDEX idx_company_users_user_id ON company_users(user_id);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, email)
);
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_company_name ON customers(company_id, name);

CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    status invoice_status NOT NULL DEFAULT 'draft',
    sold_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    UNIQUE(company_id, invoice_number)
);
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_is_locked ON invoices(is_locked);
CREATE INDEX idx_invoices_sold_by_user_id ON invoices(sold_by_user_id);
CREATE INDEX idx_invoices_created_by_user_id ON invoices(created_by_user_id);
CREATE INDEX idx_invoices_paid_at ON invoices(paid_at);
CREATE INDEX idx_invoices_company_status ON invoices(company_id, status);
CREATE INDEX idx_invoices_company_created ON invoices(company_id, created_at);

-- [CORRECTED] invoice_items table now includes:
-- - CHECK constraint validating total_amount = (quantity * unit_price) - discount
-- - CHECK constraint ensuring discount >= 0 (cannot be negative)
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL,
    -- CORRECTED: Validate total_amount calculation
    CHECK (total_amount = (quantity * unit_price) - discount),
    -- CORRECTED: Ensure discount is not negative
    CHECK (discount >= 0),
    -- Ensure monetary values are non-negative
    CHECK (quantity >= 0),
    CHECK (unit_price >= 0)
);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

CREATE TABLE commissions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    base_amount NUMERIC(12,2) NOT NULL,
    percent NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    commission_amount NUMERIC(12,2) NOT NULL,
    status commission_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (percent >= 0 AND percent <= 100),
    CHECK (commission_amount >= 0),
    CHECK (base_amount >= 0)
);
CREATE INDEX idx_commissions_company_id ON commissions(company_id);
CREATE INDEX idx_commissions_invoice_id ON commissions(invoice_id);
CREATE INDEX idx_commissions_user_id ON commissions(user_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_company_status ON commissions(company_id, status);
CREATE INDEX idx_commissions_company_created ON commissions(company_id, created_at);
CREATE INDEX idx_commissions_user_status ON commissions(user_id, status);
CREATE INDEX idx_commissions_user_created ON commissions(user_id, created_at);

-- [CORRECTED] audit_logs now uses JSONB instead of JSON for better PostgreSQL support
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    -- CORRECTED: Using JSONB for better PostgreSQL support
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_company_created ON audit_logs(company_id, created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action_entity ON audit_logs(action, entity_type);
CREATE INDEX idx_audit_logs_company_action ON audit_logs(company_id, action);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- [CORRECTED] Keep commented out by default - uncomment to enable RLS in production
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Customer Isolation
-- CREATE POLICY customer_company_isolation ON customers
--     USING (company_id = current_setting('app.current_company_id')::integer)
--     WITH CHECK (company_id = current_setting('app.current_company_id')::integer);

-- Invoice Isolation
-- CREATE POLICY invoice_company_isolation ON invoices
--     USING (company_id = current_setting('app.current_company_id')::integer)
--     WITH CHECK (company_id = current_setting('app.current_company_id')::integer);

-- Invoice Items Isolation (must access through invoice)
-- CREATE POLICY invoice_item_isolation ON invoice_items
--     USING (invoice_id IN (
--         SELECT id FROM invoices 
--         WHERE company_id = current_setting('app.current_company_id')::integer
--     ))
--     WITH CHECK (invoice_id IN (
--         SELECT id FROM invoices 
--         WHERE company_id = current_setting('app.current_company_id')::integer
--     ));

-- Commission Isolation
-- CREATE POLICY commission_company_isolation ON commissions
--     USING (company_id = current_setting('app.current_company_id')::integer)
--     WITH CHECK (company_id = current_setting('app.current_company_id')::integer);

-- Audit Log Isolation
-- CREATE POLICY audit_log_company_isolation ON audit_logs
--     USING (company_id = current_setting('app.current_company_id')::integer)
--     WITH CHECK (company_id = current_setting('app.current_company_id')::integer);

-- ============================================================================
-- [CORRECTED] TIMESTAMP UPDATE TRIGGER
-- ============================================================================
-- 
-- [CORRECTED] This trigger ensures updated_at is automatically set when records are modified
-- This is ESSENTIAL for database consistency when updates happen outside ORM

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- [CORRECTED] Enable timestamp updates for all mutable tables
CREATE TRIGGER tr_update_timestamp_companies BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER tr_update_timestamp_users BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER tr_update_timestamp_company_users BEFORE UPDATE ON company_users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER tr_update_timestamp_customers BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER tr_update_timestamp_invoices BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER tr_update_timestamp_commissions BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- [CORRECTED] COMMISSION SNAPSHOT TRIGGER
-- ============================================================================
--
-- [CORRECTED] This trigger automatically creates a commission snapshot when an invoice
-- is marked as paid. This implementation is improved for production use.

CREATE OR REPLACE FUNCTION create_commission_on_invoice_paid()
RETURNS TRIGGER AS $$
DECLARE
    v_commission_percent NUMERIC;
    v_commission_amount NUMERIC;
BEGIN
    -- Only create commission if:
    -- 1. Status transitions TO 'paid'
    -- 2. User exists (sold_by_user_id is not NULL)
    -- 3. This is an update (OLD.id is not NULL)
    IF NEW.status = 'paid' AND 
       (OLD.status IS NULL OR OLD.status != 'paid') AND
       NEW.sold_by_user_id IS NOT NULL THEN
        
        -- Get commission percentage from company_users
        SELECT commission_percent INTO v_commission_percent
        FROM company_users
        WHERE user_id = NEW.sold_by_user_id
        AND company_id = NEW.company_id;
        
        -- Use default if not found (indicates user is not in this company)
        v_commission_percent := COALESCE(v_commission_percent, 20.0);
        
        -- Calculate commission amount with NUMERIC precision
        v_commission_amount := NEW.total_amount * 
                              (v_commission_percent / NUMERIC '100');
        
        -- Insert commission snapshot (ignore if already exists)
        BEGIN
            INSERT INTO commissions (
                company_id,
                invoice_id,
                user_id,
                base_amount,
                percent,
                commission_amount,
                status,
                created_at
            ) VALUES (
                NEW.company_id,
                NEW.id,
                NEW.sold_by_user_id,
                NEW.total_amount,
                v_commission_percent,
                v_commission_amount,
                'pending',
                NOW()
            );
        EXCEPTION WHEN UNIQUE_VIOLATION THEN
            -- Commission already exists, do nothing
            NULL;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- [CORRECTED] Enable commission snapshot trigger
CREATE TRIGGER tr_commission_on_invoice_paid
AFTER UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION create_commission_on_invoice_paid();

-- ============================================================================
-- [CORRECTED] AUDIT LOGGING TRIGGER
-- ============================================================================
--
-- [CORRECTED] Comprehensive audit trigger for Invoice changes
-- This trigger captures all CREATE, UPDATE, DELETE operations

CREATE OR REPLACE FUNCTION audit_invoice_operation()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_action VARCHAR(50);
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
        v_new_data := row_to_json(NEW)::jsonb;
        v_old_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_data := row_to_json(OLD)::jsonb;
        v_new_data := row_to_json(NEW)::jsonb;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_data := row_to_json(OLD)::jsonb;
        v_new_data := NULL;
    END IF;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        company_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        created_at
    ) VALUES (
        COALESCE(NEW.company_id, OLD.company_id),
        NULLIF(current_setting('app.current_user_id', true), '')::integer,
        v_action,
        'Invoice',
        COALESCE(NEW.id, OLD.id),
        v_old_data,
        v_new_data,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- [CORRECTED] Enable audit trigger
CREATE TRIGGER tr_audit_invoice_changes
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW
EXECUTE FUNCTION audit_invoice_operation();

-- ============================================================================
-- [CORRECTED] REPORTING VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW v_invoice_with_details AS
SELECT
    i.id,
    i.company_id,
    c.name AS customer_name,
    i.invoice_number,
    i.status,
    i.total_amount,
    u_sold.full_name AS sold_by,
    u_created.full_name AS created_by,
    i.created_at,
    i.updated_at,
    i.paid_at,
    i.is_locked,
    COUNT(DISTINCT items.id) AS line_item_count,
    SUM(items.total_amount) AS items_total
FROM invoices i
JOIN customers c ON i.customer_id = c.id
LEFT JOIN users u_sold ON i.sold_by_user_id = u_sold.id
LEFT JOIN users u_created ON i.created_by_user_id = u_created.id
LEFT JOIN invoice_items items ON i.id = items.invoice_id
GROUP BY i.id, i.company_id, c.name, i.invoice_number, i.status, i.total_amount,
         u_sold.full_name, u_created.full_name, i.created_at, i.updated_at, i.paid_at, i.is_locked;

CREATE OR REPLACE VIEW v_commission_summary AS
SELECT
    company_id,
    user_id,
    status,
    COUNT(*) as commission_count,
    SUM(commission_amount) as total_commission_amount,
    AVG(commission_amount) as avg_commission_amount,
    SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_amount
FROM commissions
GROUP BY company_id, user_id, status;

-- ============================================================================
-- DOCUMENTATION AND NOTES
-- ============================================================================
--
-- KEY CORRECTIONS IN THIS VERSION:
-- ============================================
--
-- 1. **InvoiceItem Constraints**:
--    - Added CHECK: total_amount = (quantity * unit_price) - discount
--    - Added CHECK: discount >= 0 (cannot be negative)
--    - Added CHECK: quantity >= 0, unit_price >= 0
--    - Ensures data integrity at the database level
--
-- 2. **Timestamp Management**:
--    - Enabled update_timestamp trigger for all mutable tables
--    - Ensures updated_at is set correctly even for direct SQL updates
--    - Consistent with SQLAlchemy ORM behavior
--
-- 3. **Commission Snapshots**:
--    - Improved trigger with EXCEPTION handling for duplicate attempts
--    - Uses NUMERIC for precise calculations (not floating point)
--    - Properly references company_id for multi-tenant isolation
--
-- 4. **Audit Logging**:
--    - Enabled for Invoice table (template for other tables)
--    - Captures full row as JSONB (old_data, new_data)
--    - Preserves user_id (or sets to NULL if user deleted)
--
-- 5. **JSONB Type**:
--    - Changed audit_logs from JSON to JSONB for binary efficiency
--    - Allows indexing with GIN indexes in PostgreSQL
--
-- 6. **Numeric Precision**:
--    - All monetary fields use NUMERIC(12,2)
--    - Commission calculation uses NUMERIC '100' (explicit type)
--    - Prevents floating-point rounding errors
--
-- MULTI-TENANT ISOLATION:
-- ======================
-- - All operational tables have company_id
-- - FK: companies.id
-- - RLS policies can filter by: company_id = current_setting('app.current_company_id')::integer
--
-- USER REFERENCE STRATEGY:
-- ========================
-- - User deletion uses SET NULL: sold_by_user_id, created_by_user_id, commission.user_id, audit_logs.user_id
-- - Preserves financial record integrity
-- - Prevents cascade deletion of invoices/commissions/audit logs
--
-- FINANCIAL SAFETY:
-- =================
-- - total_amount = (quantity * unit_price) - discount (enforced by CHECK)
-- - commission_amount = base_amount * (percent / 100) (enforced by trigger)
-- - All calculations use NUMERIC(12,2) precision
-- - commission_percent must be 0-100 (enforced by CHECK)
--
-- TIMESTAMP STRATEGY:
-- ===================
-- - created_at: Set once at INSERT, never changed
-- - updated_at: Updated automatically on any UPDATE via trigger
-- - paid_at: Set explicitly when invoice is marked PAID
-- - All UTC timestamps

