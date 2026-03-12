-- ============================================================
-- V011 DOWN — HR Compliance & Finance (rollback)
-- Drops in reverse dependency order (children before parents)
-- ============================================================

-- Loan repayments must drop before employee_loans
DROP TABLE IF EXISTS loan_repayments       CASCADE;
DROP TABLE IF EXISTS employee_loans        CASCADE;

-- Notifications inbox
DROP TABLE IF EXISTS user_notifications    CASCADE;

-- PIP and disciplinary (disciplinary_documents before disciplinary_cases)
DROP TABLE IF EXISTS pip_records           CASCADE;
DROP TABLE IF EXISTS disciplinary_documents CASCADE;
DROP TABLE IF EXISTS disciplinary_cases    CASCADE;

-- Asset catalog (remove FK column from asset_assignments first)
ALTER TABLE asset_assignments DROP COLUMN IF EXISTS asset_catalog_id;
DROP TABLE IF EXISTS asset_catalog         CASCADE;

-- Salary revisions
DROP TABLE IF EXISTS salary_revisions      CASCADE;

-- Drop enums
DROP TYPE IF EXISTS salary_revision_type;
DROP TYPE IF EXISTS asset_status;
DROP TYPE IF EXISTS disciplinary_severity;
DROP TYPE IF EXISTS disciplinary_status;
DROP TYPE IF EXISTS pip_status;
DROP TYPE IF EXISTS notification_type;
DROP TYPE IF EXISTS loan_type;
DROP TYPE IF EXISTS loan_status;
