-- ============================================================
-- V011 — HR Compliance & Finance
-- Created: 2026-03-11
-- Description: Fills 5 functional gaps:
--   1. Salary revision history
--   2. Asset master catalog
--   3. Disciplinary cases &  Performance Improvement Plans
--   4. User notifications inbox
--   5. Employee loans & repayments
-- Dependencies: V001 (Core), V004 (Documents), V005 (Onboarding),
--               V007 (Payroll), V008 (Performance)
-- ============================================================

-- ============================================================
-- 1. SALARY REVISION HISTORY
-- ============================================================

/*
Table: salary_revisions
Use: Append-only audit trail of every compensation change for an employee.
     employees.base_salary remains the current value; this table provides history.
Relationships: employee_id → employees, approved_by/revised_by → users.
*/
DO $$ BEGIN CREATE TYPE salary_revision_type AS ENUM (
    'joining', 'promotion', 'annual_review', 'market_adjustment',
    'correction', 'off_cycle'
); EXCEPTION WHEN duplicate_object THEN null; END; $$;

CREATE TABLE IF NOT EXISTS salary_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    previous_salary NUMERIC(12,2),
    new_salary NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    revision_type salary_revision_type NOT NULL,
    reason TEXT,
    notes TEXT,
    revised_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    -- Intentionally append-only: no updated_at or deleted_at
);

COMMENT ON TABLE salary_revisions IS 'Append-only history of all salary changes per employee';

-- ============================================================
-- 2. ASSET MASTER CATALOG
-- ============================================================

/*
Table: asset_catalog
Use: Central inventory of company-owned assets. asset_assignments (V005) may
     optionally link to a catalog entry via asset_catalog_id.
Relationships: current_assignee_id → employees, work_location_id → work_locations.
     Reuses asset_type enum from V005.
*/
DO $$ BEGIN CREATE TYPE asset_status AS ENUM (
    'available', 'assigned', 'in_maintenance', 'retired', 'disposed'
); EXCEPTION WHEN duplicate_object THEN null; END; $$;

CREATE TABLE IF NOT EXISTS asset_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_tag VARCHAR(100) NOT NULL,
    serial_number TEXT,
    name VARCHAR(255) NOT NULL,
    category asset_type NOT NULL,     -- reuses V005 enum
    manufacturer TEXT,
    model TEXT,
    purchase_date DATE,
    purchase_cost NUMERIC(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    current_status asset_status NOT NULL DEFAULT 'available',
    current_assignee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    work_location_id UUID REFERENCES work_locations(id) ON DELETE SET NULL,
    warranty_expiry_date DATE,
    depreciation_schedule JSONB DEFAULT '{}',
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, asset_tag)
);

COMMENT ON TABLE asset_catalog IS 'Master inventory of company assets with lifecycle status';

-- Link asset_assignments (V005) back to catalog entries (nullable, non-breaking)
ALTER TABLE asset_assignments
    ADD COLUMN IF NOT EXISTS asset_catalog_id UUID REFERENCES asset_catalog(id) ON DELETE SET NULL;

-- ============================================================
-- 3. DISCIPLINARY CASES & PERFORMANCE IMPROVEMENT PLANS
-- ============================================================

DO $$ BEGIN CREATE TYPE disciplinary_severity AS ENUM (
    'verbal_warning', 'written_warning', 'final_warning', 'suspension', 'termination'
); EXCEPTION WHEN duplicate_object THEN null; END; $$;

DO $$ BEGIN CREATE TYPE disciplinary_status AS ENUM (
    'open', 'under_review', 'resolved', 'withdrawn'
); EXCEPTION WHEN duplicate_object THEN null; END; $$;

DO $$ BEGIN CREATE TYPE pip_status AS ENUM (
    'active', 'completed', 'failed', 'withdrawn'
); EXCEPTION WHEN duplicate_object THEN null; END; $$;

/*
Table: disciplinary_cases
Use: Records disciplinary incidents, severity, and resolution outcomes.
Relationships: employee_id → employees, raised_by → users.
*/
CREATE TABLE IF NOT EXISTS disciplinary_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    case_number VARCHAR(50) NOT NULL,
    incident_date DATE NOT NULL,
    category TEXT,  -- e.g. 'conduct', 'performance', 'attendance', 'policy_violation'
    severity disciplinary_severity NOT NULL,
    description TEXT NOT NULL,
    raised_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status disciplinary_status NOT NULL DEFAULT 'open',
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, case_number)
);

COMMENT ON TABLE disciplinary_cases IS 'Disciplinary incident records with severity and resolution tracking';

/*
Table: disciplinary_documents
Use: Links supporting documents (from V004 documents) to a disciplinary case.
*/
CREATE TABLE IF NOT EXISTS disciplinary_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES disciplinary_cases(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (case_id, document_id)
);

COMMENT ON TABLE disciplinary_documents IS 'Junction between disciplinary cases and document management';

/*
Table: pip_records
Use: Performance Improvement Plans — may be linked to a disciplinary case
     and/or a review cycle (V008).
Relationships: employee_id → employees, disciplinary_case_id → disciplinary_cases,
               review_cycle_id → review_cycles (V008).
*/
CREATE TABLE IF NOT EXISTS pip_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    disciplinary_case_id UUID REFERENCES disciplinary_cases(id) ON DELETE SET NULL,
    review_cycle_id UUID REFERENCES review_cycles(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Performance Improvement Plan',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status pip_status NOT NULL DEFAULT 'active',
    objectives JSONB NOT NULL DEFAULT '[]',   -- [{goal, metric, target, deadline}]
    check_in_schedule JSONB DEFAULT '[]',     -- [{date, completed, notes}]
    progress_notes TEXT,
    final_outcome TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date > start_date)
);

COMMENT ON TABLE pip_records IS 'Performance Improvement Plans optionally linked to disciplinary cases and review cycles';

-- ============================================================
-- 4. USER NOTIFICATIONS INBOX
-- ============================================================

/*
Table: user_notifications
Use: System-wide notification inbox for users, separate from workflow-specific
     notifications in V002. Polymorphic entity_type/entity_id allows linking
     to any object.
Append-only: no updated_at or deleted_at.
*/
DO $$ BEGIN CREATE TYPE notification_type AS ENUM (
    'system', 'workflow', 'reminder', 'alert', 'info', 'approval_required'
); EXCEPTION WHEN duplicate_object THEN null; END; $$;

CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    body TEXT,
    entity_type TEXT,   -- e.g. 'leave_request', 'expense_report', 'pip_records'
    entity_id UUID,     -- polymorphic ref to the triggering entity
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    -- Intentionally append-only: no updated_at or deleted_at
);

COMMENT ON TABLE user_notifications IS 'System-wide notification inbox; append-only';

-- ============================================================
-- 5. EMPLOYEE LOANS & REPAYMENTS
-- ============================================================

DO $$ BEGIN CREATE TYPE loan_type AS ENUM (
    'salary_advance', 'personal_loan', 'emergency_loan', 'education_loan'
); EXCEPTION WHEN duplicate_object THEN null; END; $$;

DO $$ BEGIN CREATE TYPE loan_status AS ENUM (
    'pending', 'approved', 'disbursed', 'repaying', 'settled', 'defaulted', 'rejected'
); EXCEPTION WHEN duplicate_object THEN null; END; $$;

/*
Table: employee_loans
Use: Tracks loans and salary advances granted to employees.
Relationships: employee_id → employees, approved_by → users.
*/
CREATE TABLE IF NOT EXISTS employee_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    loan_type loan_type NOT NULL,
    principal NUMERIC(12,2) NOT NULL CHECK (principal > 0),
    interest_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
    total_repayable NUMERIC(12,2) NOT NULL CHECK (total_repayable >= principal),
    disbursed_on DATE,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status loan_status NOT NULL DEFAULT 'pending',
    monthly_deduction NUMERIC(12,2),
    remaining_balance NUMERIC(12,2),
    deduction_start_date DATE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE employee_loans IS 'Loans and salary advances with repayment schedule';

/*
Table: loan_repayments
Use: Individual repayment lines — may be linked to a payroll_records row (V007)
     for automatic deduction tracking.
Append-only: no updated_at or deleted_at.
*/
CREATE TABLE IF NOT EXISTS loan_repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    loan_id UUID NOT NULL REFERENCES employee_loans(id) ON DELETE CASCADE,
    payroll_record_id UUID REFERENCES payroll_records(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method TEXT DEFAULT 'payroll_deduction',
    balance_after NUMERIC(12,2),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    -- Intentionally append-only: no updated_at or deleted_at
);

COMMENT ON TABLE loan_repayments IS 'Individual loan repayment lines, optionally linked to payroll records';

-- ============================================================
-- INDEXES
-- ============================================================

-- Salary revisions
CREATE INDEX IF NOT EXISTS idx_salary_revisions_employee ON salary_revisions (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_revisions_effective ON salary_revisions (tenant_id, effective_date);

-- Asset catalog
CREATE INDEX IF NOT EXISTS idx_asset_catalog_tenant ON asset_catalog (tenant_id);
CREATE INDEX IF NOT EXISTS idx_asset_catalog_status ON asset_catalog (tenant_id, current_status);
CREATE INDEX IF NOT EXISTS idx_asset_catalog_assignee ON asset_catalog (tenant_id, current_assignee_id);
CREATE INDEX IF NOT EXISTS idx_asset_catalog_location ON asset_catalog (tenant_id, work_location_id);

-- Disciplinary
CREATE INDEX IF NOT EXISTS idx_disciplinary_cases_employee ON disciplinary_cases (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_cases_status ON disciplinary_cases (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_disciplinary_docs_case ON disciplinary_documents (case_id);
CREATE INDEX IF NOT EXISTS idx_pip_records_employee ON pip_records (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_pip_records_status ON pip_records (tenant_id, status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_tenant ON user_notifications (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_entity ON user_notifications (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_expires ON user_notifications (expires_at) WHERE expires_at IS NOT NULL;

-- Loans
CREATE INDEX IF NOT EXISTS idx_employee_loans_employee ON employee_loans (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_loans_status ON employee_loans (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan ON loan_repayments (loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_payroll ON loan_repayments (payroll_record_id) WHERE payroll_record_id IS NOT NULL;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_asset_catalog_updated_at
    BEFORE UPDATE ON asset_catalog
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciplinary_cases_updated_at
    BEFORE UPDATE ON disciplinary_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pip_records_updated_at
    BEFORE UPDATE ON pip_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_loans_updated_at
    BEFORE UPDATE ON employee_loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE salary_revisions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_catalog          ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_cases     ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pip_records            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_loans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments        ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON salary_revisions       USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON asset_catalog          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON disciplinary_cases     USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON disciplinary_documents USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON pip_records            USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON user_notifications     USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON employee_loans         USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON loan_repayments        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
