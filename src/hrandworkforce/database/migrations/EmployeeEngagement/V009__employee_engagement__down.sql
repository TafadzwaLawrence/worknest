-- ============================================================
-- DOWN: V009 — Employee Engagement
-- Reverses engagement, recognition, rewards, feedback, pulse,
-- and mood-tracking tables and types.
-- Run before V008 when rolling back.
-- ============================================================

-- Drop tables in reverse creation order
DROP TABLE IF EXISTS engagement_trends CASCADE;
DROP TABLE IF EXISTS team_engagement_metrics CASCADE;
DROP TABLE IF EXISTS engagement_scores CASCADE;
DROP TABLE IF EXISTS mood_tracking CASCADE;
DROP TABLE IF EXISTS pulse_responses CASCADE;
DROP TABLE IF EXISTS pulse_questions CASCADE;
DROP TABLE IF EXISTS feedback_actions CASCADE;
DROP TABLE IF EXISTS feedback_votes CASCADE;
DROP TABLE IF EXISTS feedback_comments CASCADE;
DROP TABLE IF EXISTS employee_feedback CASCADE;
DROP TABLE IF EXISTS feedback_channels CASCADE;
DROP TABLE IF EXISTS reward_redemptions CASCADE;
DROP TABLE IF EXISTS rewards_catalog CASCADE;
DROP TABLE IF EXISTS employee_points CASCADE;
DROP TABLE IF EXISTS recognition_tags CASCADE;
DROP TABLE IF EXISTS recognitions CASCADE;
DROP TABLE IF EXISTS recognition_programs CASCADE;
DROP TABLE IF EXISTS survey_participation CASCADE;
DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS survey_questions CASCADE;
DROP TABLE IF EXISTS engagement_surveys CASCADE;

-- Drop enum types unique to this module
DROP TYPE IF EXISTS sentiment_score CASCADE;
DROP TYPE IF EXISTS feedback_visibility CASCADE;
DROP TYPE IF EXISTS recognition_type CASCADE;
DROP TYPE IF EXISTS question_type CASCADE;
DROP TYPE IF EXISTS survey_type CASCADE;
DROP TYPE IF EXISTS survey_status CASCADE;

-- Note: update_updated_at_column() is owned by V001; not dropped here.
