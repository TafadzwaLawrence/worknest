-- ============================================================
-- DOWN: V005 — Onboarding & Offboarding
-- Reverses onboarding/offboarding tables and types.
-- Run before V004 when rolling back.
-- ============================================================

-- Drop tables in reverse creation order
DROP TABLE IF EXISTS offboarding_notes CASCADE;
DROP TABLE IF EXISTS onboarding_notes CASCADE;
DROP TABLE IF EXISTS clearance_checklist_items CASCADE;
DROP TABLE IF EXISTS knowledge_transfer_records CASCADE;
DROP TABLE IF EXISTS exit_interviews CASCADE;
DROP TABLE IF EXISTS asset_assignments CASCADE;
DROP TABLE IF EXISTS provisioning_requests CASCADE;
DROP TABLE IF EXISTS offboarding_case_tasks CASCADE;
DROP TABLE IF EXISTS offboarding_cases CASCADE;
DROP TABLE IF EXISTS onboarding_case_tasks CASCADE;
DROP TABLE IF EXISTS onboarding_cases CASCADE;
DROP TABLE IF EXISTS offboarding_template_tasks CASCADE;
DROP TABLE IF EXISTS offboarding_templates CASCADE;
DROP TABLE IF EXISTS onboarding_template_tasks CASCADE;
DROP TABLE IF EXISTS onboarding_templates CASCADE;

-- Drop enum types unique to this module
-- note_visibility is canonically owned by V003; not dropped here
DROP TYPE IF EXISTS asset_type CASCADE;
DROP TYPE IF EXISTS provision_status CASCADE;
DROP TYPE IF EXISTS priority_level CASCADE;
DROP TYPE IF EXISTS case_type CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS offboarding_status CASCADE;
DROP TYPE IF EXISTS onboarding_status CASCADE;

-- Note: update_updated_at_column() and _get_tenant_id_for() are
-- owned by V001 and V004 respectively; not dropped here.
