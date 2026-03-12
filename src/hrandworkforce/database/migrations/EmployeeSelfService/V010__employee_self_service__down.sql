-- ============================================================
-- DOWN: V010 — Employee Self Service
-- Reverses ESS tables, types, and functions.
-- Run FIRST when rolling back all migrations (highest version).
-- ============================================================

-- Drop tables in reverse creation order
DROP TABLE IF EXISTS ess_attachments CASCADE;
DROP TABLE IF EXISTS ess_document_access CASCADE;
DROP TABLE IF EXISTS ess_acknowledgments CASCADE;
DROP TABLE IF EXISTS ess_required_acknowledgments CASCADE;
DROP TABLE IF EXISTS ess_time_off_portal CASCADE;
DROP TABLE IF EXISTS ess_time_off_drafts CASCADE;
DROP TABLE IF EXISTS ess_profile_request_items CASCADE;
DROP TABLE IF EXISTS ess_profile_requests CASCADE;
DROP TABLE IF EXISTS ess_portal_preferences CASCADE;
DROP TABLE IF EXISTS ess_settings CASCADE;

-- Drop module-specific trigger functions
DROP FUNCTION IF EXISTS trg_validate_ess_leave_tenant() CASCADE;
DROP FUNCTION IF EXISTS trg_validate_ess_doc_tenant() CASCADE;
DROP FUNCTION IF EXISTS trg_validate_ess_employee_tenant() CASCADE;

-- Drop enum types unique to this module
DROP TYPE IF EXISTS access_type CASCADE;
DROP TYPE IF EXISTS ess_owner_type CASCADE;
DROP TYPE IF EXISTS ess_ack_status CASCADE;
DROP TYPE IF EXISTS ess_request_status CASCADE;

-- Note: update_updated_at_column() is owned by V001; not dropped here.
-- Note: _get_tenant_id_for() is owned by V004; not dropped here.
