-- ============================================================
-- DOWN: V002 — Workflows
-- Reverses workflow engine tables and types.
-- Run before V001 when rolling back.
-- ============================================================

-- Drop tables in reverse creation order
DROP TABLE IF EXISTS recruitment_workflows CASCADE;
DROP TABLE IF EXISTS expense_workflows CASCADE;
DROP TABLE IF EXISTS leave_request_workflows CASCADE;
DROP TABLE IF EXISTS step_metrics CASCADE;
DROP TABLE IF EXISTS workflow_metrics CASCADE;
DROP TABLE IF EXISTS condition_groups CASCADE;
DROP TABLE IF EXISTS workflow_conditions CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS workflow_notifications CASCADE;
DROP TABLE IF EXISTS step_delegations CASCADE;
DROP TABLE IF EXISTS step_actions CASCADE;
DROP TABLE IF EXISTS instance_steps CASCADE;
DROP TABLE IF EXISTS workflow_instances CASCADE;
DROP TABLE IF EXISTS escalation_rules CASCADE;
DROP TABLE IF EXISTS step_assignments CASCADE;
DROP TABLE IF EXISTS workflow_steps CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;

-- Drop enum types unique to this module
DROP TYPE IF EXISTS escalation_strategy CASCADE;
DROP TYPE IF EXISTS condition_operator CASCADE;
DROP TYPE IF EXISTS assignment_type CASCADE;
DROP TYPE IF EXISTS approval_action CASCADE;
DROP TYPE IF EXISTS step_type CASCADE;
DROP TYPE IF EXISTS instance_status CASCADE;
DROP TYPE IF EXISTS workflow_status CASCADE;

-- Note: update_updated_at_column() is owned by V001; not dropped here.
