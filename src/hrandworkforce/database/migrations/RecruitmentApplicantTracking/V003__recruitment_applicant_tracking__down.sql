-- ============================================================
-- DOWN: V003 — Recruitment & Applicant Tracking
-- Reverses recruitment tables and types.
-- Run before V002 when rolling back.
-- ============================================================

-- Drop tables in reverse creation order
DROP TABLE IF EXISTS rat_activity_logs CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS tagged_items CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS interviewers CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS pipeline_stages CASCADE;
DROP TABLE IF EXISTS pipelines CASCADE;
DROP TABLE IF EXISTS applicant_documents CASCADE;
DROP TABLE IF EXISTS applicant_contacts CASCADE;
DROP TABLE IF EXISTS applicants CASCADE;
DROP TABLE IF EXISTS job_postings CASCADE;
DROP TABLE IF EXISTS job_requisitions CASCADE;

-- Drop enum types unique to (or canonically owned by) this module
-- note_visibility is the canonical definition; V005 uses a guard copy
DROP TYPE IF EXISTS note_visibility CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS applicant_contact_type CASCADE;
DROP TYPE IF EXISTS offer_status CASCADE;
DROP TYPE IF EXISTS interview_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;

-- Note: update_updated_at_column() is owned by V001; not dropped here.
