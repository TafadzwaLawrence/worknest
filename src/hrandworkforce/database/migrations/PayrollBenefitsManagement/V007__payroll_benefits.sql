-- =====================
-- PAYROLL & BENEFITS MANAGEMENT SCHEMA
-- Extends the existing HR & Workforce Management System
-- Design principles: 
--   - Consistent multi-tenant architecture (tenant_id on all tables)
--   - Strong referential integrity and tenant isolation
--   - Audit fields (created_at, updated_at, version) and soft deletes
--   - Support for complex payroll scenarios: multiple pay rates, deductions, benefits
-- =====================

-- =====================
-- ENUMS / TYPE DEFINITIONS
-- =====================
-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Additional extensions
CREATE EXTENSION IF NOT EXISTS citext;

-- Utility function: sets updated_at on row updates (uniform pattern)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN CREATE TYPE pay_frequency AS ENUM ('weekly', 'biweekly', 'semimonthly', 'monthly', 'custom'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE pay_method AS ENUM ('direct_deposit', 'check', 'cash', 'payroll_card'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
-- Renamed from employment_status to avoid collision with core_configuration's employment_status enum
DO $$ BEGIN CREATE TYPE payroll_employment_status AS ENUM ('active', 'on_leave', 'terminated', 'retired'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE deduction_type AS ENUM ('tax', 'benefit', 'garnish', 'retirement', 'other'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
-- Extend deduction_type for loan repayments (idempotent — ADD VALUE IF NOT EXISTS is PG 12+)
DO $$ BEGIN ALTER TYPE deduction_type ADD VALUE IF NOT EXISTS 'loan_repayment'; EXCEPTION WHEN others THEN null; END; $$;
DO $$ BEGIN CREATE TYPE benefit_type AS ENUM ('health', 'dental', 'vision', 'retirement', 'life_insurance', 'disability', 'flex_spending', 'hsa', 'other'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE tax_filing_status AS ENUM ('single', 'married', 'married_separate', 'head_household', 'qualifying_widow'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE payroll_status AS ENUM ('draft', 'processing', 'processed', 'approved', 'paid', 'reversed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END; $$;

-- =====================
-- EMPLOYEE COMPENSATION STRUCTURE
-- =====================

-- Pay structures for employees (supports multiple pay rates for different scenarios)
/*
Table: pay_structures
Use: Defines pay arrangements per employee (salary/hourly/commission/bonus), with effective dates and primary flag.
Relationships: References employees; used by payroll calculations and reporting.
Implementation: Unique constraints and indexes on employee and dates recommended for performance.
*/
CREATE TABLE IF NOT EXISTS pay_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    pay_type TEXT NOT NULL, -- 'salary', 'hourly', 'commission', 'bonus'
    pay_rate NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    effective_date DATE NOT NULL,
    end_date DATE,
    is_primary BOOLEAN DEFAULT false,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- =====================
-- TAX INFORMATION
-- =====================

/*
Table: employee_tax_info
Use: Captures per-employee tax filing details and certificates used for payroll tax computations.
Relationships: References employees; joined with jurisdictions and payroll_taxes during processing.
*/
CREATE TABLE IF NOT EXISTS employee_tax_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    filing_status tax_filing_status,
    allowances INT DEFAULT 0,
    additional_withholding NUMERIC(10,2) DEFAULT 0,
    exempt_federal BOOLEAN DEFAULT false,
    exempt_state BOOLEAN DEFAULT false,
    exempt_local BOOLEAN DEFAULT false,
    social_security_number TEXT, -- SECURITY: PII — must be encrypted at application layer before storage
    w4_certificate JSONB, -- Store W4 form data
    state_withholding_cert JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, employee_id)
);

-- Tax jurisdictions (federal, state, local)
/*
Table: tax_jurisdictions
Use: Defines federal/state/local jurisdictions and tax rates over time for calculation.
Implementation: Effective dating enables rate changes without losing history.
*/
CREATE TABLE IF NOT EXISTS tax_jurisdictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    jurisdiction_type TEXT NOT NULL, -- 'federal', 'state', 'local'
    jurisdiction_code TEXT NOT NULL, -- e.g., 'CA', 'US-FED'
    name TEXT NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    tax_rates JSONB NOT NULL, -- {regular: rate, supplemental: rate, etc.}
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, jurisdiction_code, effective_date)
);

-- =====================
-- BENEFITS MANAGEMENT
-- =====================

-- Benefit plans offered by the company
/*
Table: benefit_plans
Use: Company-offered benefits with eligibility and contribution models.
Relationships: Referenced by benefit_enrollments and payroll_deductions.
*/
CREATE TABLE IF NOT EXISTS benefit_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    benefit_type benefit_type NOT NULL,
    provider_name TEXT,
    plan_code TEXT,
    eligibility_rules JSONB, -- {waiting_period_days: 90, min_hours_week: 30, etc.}
    employer_contribution JSONB, -- {type: 'percentage', value: 80} or {type: 'fixed', value: 500}
    employee_contribution JSONB,
    effective_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

-- Employee benefit enrollments
/*
Table: benefit_enrollments
Use: Employee elections into benefit plans with coverage levels and dates.
Relationships: employees and benefit_plans; used for payroll deductions and reporting.
*/
CREATE TABLE IF NOT EXISTS benefit_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    benefit_plan_id UUID NOT NULL REFERENCES benefit_plans(id) ON DELETE CASCADE,
    coverage_level TEXT, -- 'employee', 'employee+spouse', 'family'
    election_amount NUMERIC(10,2),
    effective_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, employee_id, benefit_plan_id, effective_date)
);

-- Dependent information for benefits
/*
Table: dependents
Use: Dependents/beneficiaries for employee benefits and life insurance.
Relationships: References employees; linked by benefit processing where applicable.
*/
CREATE TABLE IF NOT EXISTS dependents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    relationship TEXT NOT NULL, -- 'spouse', 'child', 'domestic_partner'
    date_of_birth DATE,
    ssn TEXT, -- SECURITY: PII — must be encrypted at application layer before storage
    is_beneficiary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- =====================
-- PAYROLL PROCESSING
-- =====================

-- Pay periods
/*
Table: pay_periods
Use: Defines payroll periods with frequency, start/end, and pay date.
Relationships: payroll_runs reference periods; records carry period_id for aggregation.
*/
CREATE TABLE IF NOT EXISTS pay_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    period_name TEXT NOT NULL,
    pay_frequency pay_frequency NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    is_processed BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, start_date, end_date)
);

-- Payroll runs (each processing of a pay period)
/*
Table: payroll_runs
Use: A single execution of payroll for a pay_period, tracking totals and approval state.
Relationships: References pay_periods; parent for payroll_records.
*/
CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pay_period_id UUID NOT NULL REFERENCES pay_periods(id) ON DELETE CASCADE,
    run_number INT NOT NULL DEFAULT 1,
    status payroll_status DEFAULT 'draft',
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    total_gross NUMERIC(15,2) DEFAULT 0,
    total_net NUMERIC(15,2) DEFAULT 0,
    total_taxes NUMERIC(15,2) DEFAULT 0,
    total_deductions NUMERIC(15,2) DEFAULT 0,
    employee_count INT DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, pay_period_id, run_number)
);

-- Individual employee payroll records
/*
Table: payroll_records
Use: Per-employee payroll snapshot for a run, with hours, pay, method, and status.
Relationships: References payroll_runs, employees, pay_periods; parent for earnings/deductions/taxes.
*/
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    pay_period_id UUID NOT NULL REFERENCES pay_periods(id) ON DELETE CASCADE,
    regular_hours NUMERIC(6,2) DEFAULT 0,
    overtime_hours NUMERIC(6,2) DEFAULT 0,
    double_time_hours NUMERIC(6,2) DEFAULT 0,
    regular_pay NUMERIC(12,2) DEFAULT 0,
    overtime_pay NUMERIC(12,2) DEFAULT 0,
    double_time_pay NUMERIC(12,2) DEFAULT 0,
    gross_pay NUMERIC(12,2) DEFAULT 0,
    net_pay NUMERIC(12,2) DEFAULT 0,
    status payroll_status DEFAULT 'draft',
    pay_method pay_method,
    bank_account_info JSONB, -- SECURITY: PII — must be encrypted at application layer before storage (bank details for direct deposit)
    check_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, payroll_run_id, employee_id)
);

-- Earnings (bonuses, commissions, etc.)
/*
Table: payroll_earnings
Use: Additional earnings components (bonus, commission, reimbursements) per payroll record.
*/
CREATE TABLE IF NOT EXISTS payroll_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
    earning_type TEXT NOT NULL, -- 'bonus', 'commission', 'reimbursement'
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    hours NUMERIC(6,2),
    rate NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deductions from payroll
/*
Table: payroll_deductions
Use: Deduction lines (benefits, garnishments, retirement) per payroll record.
Relationships: Optionally references benefit_plans for mapping to plan contributions.
*/
CREATE TABLE IF NOT EXISTS payroll_deductions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
    deduction_type deduction_type NOT NULL,
    benefit_plan_id UUID REFERENCES benefit_plans(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    is_pre_tax BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tax calculations for each payroll record
/*
Table: payroll_taxes
Use: Computed tax obligations for each payroll record per jurisdiction and tax_type.
Relationships: References payroll_records and tax_jurisdictions.
*/
CREATE TABLE IF NOT EXISTS payroll_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
    jurisdiction_id UUID NOT NULL REFERENCES tax_jurisdictions(id) ON DELETE CASCADE,
    tax_type TEXT NOT NULL, -- 'federal_income', 'social_security', 'medicare', 'state_income'
    taxable_amount NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    employer_tax_amount NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, payroll_record_id, jurisdiction_id, tax_type)
);

-- =====================
-- TIME AND ATTENDANCE (Linked to Payroll)
-- =====================

/*
Table: time_entries
Use: Raw time logs flowing into payroll computations (regular/OT/double time), approvals and audit.
Relationships: References employees; often joined to schedules/attendance when present.
*/
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    regular_hours NUMERIC(6,2),
    overtime_hours NUMERIC(6,2),
    double_time_hours NUMERIC(6,2),
    break_minutes INT DEFAULT 0,
    pay_code TEXT, -- 'regular', 'overtime', 'vacation', 'sick'
    project_code TEXT,
    task_description TEXT,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- =====================
-- PAYROLL ADJUSTMENTS & CORRECTIONS
-- =====================

/*
Table: payroll_adjustments
Use: Adjustments/corrections/voids applied to prior payroll outcomes.
Relationships: Optionally references original payroll_records; captures reason and effective_date.
*/
CREATE TABLE IF NOT EXISTS payroll_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    original_payroll_record_id UUID REFERENCES payroll_records(id) ON DELETE SET NULL,
    adjustment_type TEXT NOT NULL, -- 'correction', 'adjustment', 'void'
    reason TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    effective_date DATE NOT NULL,
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================
-- PAYROLL REPORTS & FILINGS
-- =====================

/*
Table: payroll_reports
Use: Generated statutory/management reports and filing metadata per period.
*/
CREATE TABLE IF NOT EXISTS payroll_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL, -- '941', 'w2', 'w3', 'state_unemployment'
    reporting_period TEXT NOT NULL, -- 'Q1-2024', '2024'
    generated_date DATE NOT NULL DEFAULT CURRENT_DATE,
    filing_deadline DATE,
    filed_date DATE,
    status TEXT DEFAULT 'draft', -- 'draft', 'generated', 'filed'
    file_reference TEXT,
    total_wages NUMERIC(15,2) DEFAULT 0,
    total_taxes NUMERIC(15,2) DEFAULT 0,
    employee_count INT DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- EXPENSE REPORTS
-- =====================

DO $$ BEGIN CREATE TYPE expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'paid', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END; $$;

/*
Table: expense_reports
Use: Employee expense claims with line items and receipts; referenced by expense_workflows
     in V002 (Workflows) for approval tracking.
Relationships: References employees; linked to workflow_instances via expense_workflows.
*/
CREATE TABLE IF NOT EXISTS expense_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status expense_status NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    rejection_reason TEXT,
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Each item: {description, category, amount, currency, receipt_date, vendor}
    receipt_documents JSONB DEFAULT '[]'::jsonb,
    -- Each item: {storage_key, filename, content_type, uploaded_at}
    reimbursement_method TEXT, -- 'payroll', 'direct_transfer', 'check'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version INT NOT NULL DEFAULT 1
);

-- =====================
-- INDEXES
-- =====================

-- Expense reports
CREATE INDEX IF NOT EXISTS idx_expense_reports_employee ON expense_reports (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_expense_reports_status ON expense_reports (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_expense_reports_submitted ON expense_reports (tenant_id, submitted_at) WHERE deleted_at IS NULL;

-- Employees
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees (tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees (system_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees (tenant_id, employment_status);

-- Pay structures
CREATE INDEX IF NOT EXISTS idx_pay_structures_employee ON pay_structures (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_pay_structures_effective ON pay_structures (tenant_id, effective_date);

-- Tax information
CREATE INDEX IF NOT EXISTS idx_tax_info_employee ON employee_tax_info (tenant_id, employee_id);

-- Benefits
CREATE INDEX IF NOT EXISTS idx_benefit_plans_active ON benefit_plans (tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_benefit_enrollments_employee ON benefit_enrollments (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_benefit_enrollments_effective ON benefit_enrollments (tenant_id, effective_date);

-- Payroll processing
CREATE INDEX IF NOT EXISTS idx_pay_periods_dates ON pay_periods (tenant_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON payroll_runs (tenant_id, pay_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee ON payroll_records (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_run ON payroll_records (tenant_id, payroll_run_id);

-- Time entries
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries (tenant_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_employee_date ON time_entries (tenant_id, employee_id, entry_date);

-- =====================
-- TRIGGERS & FUNCTIONS
-- =====================

-- Explicit BEFORE UPDATE triggers using update_updated_at_column()
CREATE TRIGGER update_pay_structures_updated_at BEFORE UPDATE ON pay_structures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_tax_info_updated_at BEFORE UPDATE ON employee_tax_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_jurisdictions_updated_at BEFORE UPDATE ON tax_jurisdictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_benefit_plans_updated_at BEFORE UPDATE ON benefit_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_benefit_enrollments_updated_at BEFORE UPDATE ON benefit_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dependents_updated_at BEFORE UPDATE ON dependents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pay_periods_updated_at BEFORE UPDATE ON pay_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_runs_updated_at BEFORE UPDATE ON payroll_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON payroll_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_reports_updated_at BEFORE UPDATE ON payroll_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tenant validation triggers
CREATE OR REPLACE FUNCTION trg_validate_payroll_tenant() RETURNS trigger AS $$
DECLARE ref_tenant UUID;
BEGIN
    -- Validate employee references
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.employee_id IS NOT NULL THEN
            ref_tenant := _get_tenant_id_for('employees', NEW.employee_id);
            IF ref_tenant IS NOT NULL AND ref_tenant != NEW.tenant_id THEN
                RAISE EXCEPTION 'Tenant mismatch in %: employee_id % belongs to tenant %', TG_TABLE_NAME, NEW.employee_id, ref_tenant;
            END IF;
        END IF;

        -- Validate benefit plan references
        IF NEW.benefit_plan_id IS NOT NULL THEN
            ref_tenant := _get_tenant_id_for('benefit_plans', NEW.benefit_plan_id);
            IF ref_tenant IS NOT NULL AND ref_tenant != NEW.tenant_id THEN
                RAISE EXCEPTION 'Tenant mismatch in %: benefit_plan_id % belongs to tenant %', TG_TABLE_NAME, NEW.benefit_plan_id, ref_tenant;
            END IF;
        END IF;

        -- Validate pay period references
        IF NEW.pay_period_id IS NOT NULL THEN
            ref_tenant := _get_tenant_id_for('pay_periods', NEW.pay_period_id);
            IF ref_tenant IS NOT NULL AND ref_tenant != NEW.tenant_id THEN
                RAISE EXCEPTION 'Tenant mismatch in %: pay_period_id % belongs to tenant %', TG_TABLE_NAME, NEW.pay_period_id, ref_tenant;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply tenant validation to payroll tables
DROP TRIGGER IF EXISTS trg_validate_payroll_tenant ON pay_structures;
CREATE TRIGGER trg_validate_payroll_tenant BEFORE INSERT OR UPDATE ON pay_structures FOR EACH ROW EXECUTE PROCEDURE trg_validate_payroll_tenant();

DROP TRIGGER IF EXISTS trg_validate_payroll_tenant ON employee_tax_info;
CREATE TRIGGER trg_validate_payroll_tenant BEFORE INSERT OR UPDATE ON employee_tax_info FOR EACH ROW EXECUTE PROCEDURE trg_validate_payroll_tenant();

DROP TRIGGER IF EXISTS trg_validate_payroll_tenant ON benefit_enrollments;
CREATE TRIGGER trg_validate_payroll_tenant BEFORE INSERT OR UPDATE ON benefit_enrollments FOR EACH ROW EXECUTE PROCEDURE trg_validate_payroll_tenant();

DROP TRIGGER IF EXISTS trg_validate_payroll_tenant ON payroll_records;
CREATE TRIGGER trg_validate_payroll_tenant BEFORE INSERT OR UPDATE ON payroll_records FOR EACH ROW EXECUTE PROCEDURE trg_validate_payroll_tenant();

DROP TRIGGER IF EXISTS trg_validate_payroll_tenant ON time_entries;
CREATE TRIGGER trg_validate_payroll_tenant BEFORE INSERT OR UPDATE ON time_entries FOR EACH ROW EXECUTE PROCEDURE trg_validate_payroll_tenant();

-- =====================
-- VIEWS FOR REPORTING
-- =====================

-- Employee compensation summary view
CREATE OR REPLACE VIEW employee_compensation_summary AS
SELECT 
    e.tenant_id,
    e.id AS employee_id,
    e.employee_code AS employee_number,
    e.system_user_id,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    e.date_of_join AS hire_date,
    e.employment_status,
    ps.pay_type,
    ps.pay_rate,
    ps.currency,
    ps.effective_date AS pay_effective_date,
    (SELECT COUNT(*) FROM benefit_enrollments be WHERE be.employee_id = e.id AND be.is_active = true) AS active_benefits_count,
    (SELECT SUM((employee_contribution->>'value')::NUMERIC) FROM benefit_enrollments be 
     JOIN benefit_plans bp ON be.benefit_plan_id = bp.id 
     WHERE be.employee_id = e.id AND be.is_active = true) AS total_benefit_cost
FROM employees e
LEFT JOIN pay_structures ps ON ps.employee_id = e.id AND ps.is_primary = true AND ps.deleted_at IS NULL
WHERE e.deleted_at IS NULL;

-- Payroll run summary view
CREATE OR REPLACE VIEW payroll_run_summary AS
SELECT 
    pr.tenant_id,
    pr.id AS payroll_run_id,
    pr.run_number,
    pr.status,
    pp.period_name,
    pp.start_date,
    pp.end_date,
    pp.pay_date,
    pr.total_gross,
    pr.total_net,
    pr.total_taxes,
    pr.total_deductions,
    pr.employee_count,
    pr.processed_at,
    CONCAT(u.username) AS processed_by_name
FROM payroll_runs pr
JOIN pay_periods pp ON pr.pay_period_id = pp.id
LEFT JOIN users u ON pr.processed_by = u.id;

-- =====================
-- SECURITY NOTES
-- =====================
-- In production, consider:
-- 1. Encrypting sensitive fields (SSN, bank account info) using pgcrypto
-- 2. Implementing Row Level Security (RLS) policies
-- 3. Adding audit triggers for sensitive operations
-- 4. Implementing proper access controls for payroll data

-- Example encrypted field setup (commented out):
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- ALTER TABLE employee_tax_info 
--   ALTER COLUMN social_security_number SET DATA BYTEA,
--   ALTER COLUMN social_security_number SET DEFAULT encrypt('', 'key', 'aes');

-- =====================
-- INITIAL DATA (Optional)
-- =====================
-- Insert default tax jurisdictions for US federal taxes
-- INSERT INTO tax_jurisdictions (tenant_id, jurisdiction_type, jurisdiction_code, name, effective_date, tax_rates)
-- VALUES 
-- ('00000000-0000-0000-0000-000000000000', 'federal', 'US-FED', 'US Federal Tax', '2024-01-01', 
--  '{"social_security": {"employee_rate": 0.062, "employer_rate": 0.062, "wage_base": 168600}, 
--    "medicare": {"employee_rate": 0.0145, "employer_rate": 0.0145, "additional_rate": 0.009}}');

-- End of Payroll and Benefits schema

-- ====================================
-- ROW-LEVEL SECURITY (RLS)
-- ====================================
ALTER TABLE pay_structures       ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tax_info    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_jurisdictions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_enrollments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_periods          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_earnings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_deductions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_taxes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_adjustments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_reports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_reports      ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON pay_structures      USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON employee_tax_info   USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON tax_jurisdictions   USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON benefit_plans       USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON benefit_enrollments USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON dependents          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON pay_periods         USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON payroll_runs        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON payroll_records     USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON payroll_earnings    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON payroll_deductions  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON payroll_taxes       USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON time_entries        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON payroll_adjustments USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON payroll_reports     USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON expense_reports     USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

--