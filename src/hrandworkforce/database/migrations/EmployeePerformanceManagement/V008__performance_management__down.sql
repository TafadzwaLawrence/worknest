-- ============================================================
-- DOWN: V008 — Employee Performance Management
-- Reverses performance management tables and types.
-- Run before V007 when rolling back.
-- ============================================================

-- Drop tables in reverse creation order
DROP TABLE IF EXISTS development_plan_items CASCADE;
DROP TABLE IF EXISTS development_plans CASCADE;
DROP TABLE IF EXISTS training_requests CASCADE;
DROP TABLE IF EXISTS learning_paths CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS course_content CASCADE;
DROP TABLE IF EXISTS course_modules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS employee_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS employee_competencies CASCADE;
DROP TABLE IF EXISTS competencies CASCADE;
DROP TABLE IF EXISTS competency_frameworks CASCADE;
DROP TABLE IF EXISTS goal_updates CASCADE;
DROP TABLE IF EXISTS goal_alignments CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS goal_templates CASCADE;
DROP TABLE IF EXISTS review_responses CASCADE;
DROP TABLE IF EXISTS review_participants CASCADE;
DROP TABLE IF EXISTS performance_reviews CASCADE;
DROP TABLE IF EXISTS review_templates CASCADE;
DROP TABLE IF EXISTS review_cycles CASCADE;

-- Drop enum types unique to this module
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;
DROP TYPE IF EXISTS course_status CASCADE;
DROP TYPE IF EXISTS competency_level CASCADE;
DROP TYPE IF EXISTS goal_period CASCADE;
DROP TYPE IF EXISTS goal_type CASCADE;
DROP TYPE IF EXISTS goal_status CASCADE;
DROP TYPE IF EXISTS rating_scale CASCADE;
DROP TYPE IF EXISTS review_status CASCADE;
DROP TYPE IF EXISTS review_type CASCADE;

-- Note: update_updated_at_column() is owned by V001; not dropped here.
