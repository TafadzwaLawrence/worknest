-- ============================================================
-- DOWN: V007 — Payroll & Benefits Management
-- Reverses payroll, benefits, and expense tables and types.
-- Run before V006 when rolling back.
-- ============================================================

-- Drop tables in reverse creation order
DROP TABLE IF EXISTS expense_reports CASCADE;
DROP TABLE IF EXISTS payroll_reports CASCADE;
DROP TABLE IF EXISTS payroll_adjustments CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS payroll_taxes CASCADE;
DROP TABLE IF EXISTS payroll_deductions CASCADE;
DROP TABLE IF EXISTS payroll_earnings CASCADE;
DROP TABLE IF EXISTS payroll_records CASCADE;
DROP TABLE IF EXISTS payroll_runs CASCADE;
DROP TABLE IF EXISTS pay_periods CASCADE;
DROP TABLE IF EXISTS dependents CASCADE;
DROP TABLE IF EXISTS benefit_enrollments CASCADE;
DROP TABLE IF EXISTS benefit_plans CASCADE;
DROP TABLE IF EXISTS tax_jurisdictions CASCADE;
DROP TABLE IF EXISTS employee_tax_info CASCADE;
DROP TABLE IF EXISTS pay_structures CASCADE;

-- Drop enum types unique to this module
DROP TYPE IF EXISTS expense_status CASCADE;
DROP TYPE IF EXISTS payroll_status CASCADE;
DROP TYPE IF EXISTS tax_filing_status CASCADE;
DROP TYPE IF EXISTS benefit_type CASCADE;
DROP TYPE IF EXISTS deduction_type CASCADE;
DROP TYPE IF EXISTS payroll_employment_status CASCADE;
DROP TYPE IF EXISTS pay_method CASCADE;
DROP TYPE IF EXISTS pay_frequency CASCADE;

-- Note: update_updated_at_column() is owned by V001; not dropped here.
