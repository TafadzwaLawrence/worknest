-- ============================================================
-- DOWN: V001 — Core Configuration
-- Reverses core_configuration tables, types, functions,
-- extensions, and seed data.
-- Run this LAST when rolling back all migrations (after V010–V002).
-- ============================================================

-- Drop tables in reverse creation order (children before parents)
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS employee_contacts CASCADE;
DROP TABLE IF EXISTS employee_addresses CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS work_locations CASCADE;
DROP TABLE IF EXISTS designations CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop functions (update_updated_at_column is shared across all modules;
-- dropping it here after all other modules are already rolled back is safe)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_employee_code() CASCADE;
DROP FUNCTION IF EXISTS update_department_head() CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS gender_type CASCADE;
DROP TYPE IF EXISTS contact_type CASCADE;
DROP TYPE IF EXISTS address_type CASCADE;
DROP TYPE IF EXISTS employment_status CASCADE;
DROP TYPE IF EXISTS employment_type CASCADE;

-- Extensions (commented out — these may be used outside this schema)
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "citext";
