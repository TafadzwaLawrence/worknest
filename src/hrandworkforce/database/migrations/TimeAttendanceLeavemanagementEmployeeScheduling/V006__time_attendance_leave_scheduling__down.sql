-- ============================================================
-- DOWN: V006 — Time, Attendance, Leave & Scheduling
-- Reverses time/attendance/leave/scheduling tables, types, and functions.
-- Run before V005 when rolling back.
-- ============================================================

-- Drop tables in reverse creation order
DROP TABLE IF EXISTS overtime_requests CASCADE;
DROP TABLE IF EXISTS timesheets CASCADE;
DROP TABLE IF EXISTS time_off_requests CASCADE;
DROP TABLE IF EXISTS shift_swaps CASCADE;
DROP TABLE IF EXISTS scheduled_shifts CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS leave_request_approvals CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS employee_leave_entitlements CASCADE;
DROP TABLE IF EXISTS leave_periods CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS attendance_corrections CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_rules CASCADE;
DROP TABLE IF EXISTS shift_templates CASCADE;

-- Drop module-specific functions
DROP FUNCTION IF EXISTS calculate_overtime_hours() CASCADE;
DROP FUNCTION IF EXISTS update_attendance_from_leave() CASCADE;
DROP FUNCTION IF EXISTS validate_schedule_conflict() CASCADE;

-- Drop enum types unique to this module
DROP TYPE IF EXISTS correction_type CASCADE;
DROP TYPE IF EXISTS leave_accrual_type CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;
DROP TYPE IF EXISTS shift_status CASCADE;
DROP TYPE IF EXISTS schedule_status CASCADE;
DROP TYPE IF EXISTS timesheet_status CASCADE;
DROP TYPE IF EXISTS leave_request_status CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;

-- Note: update_updated_at_column() is owned by V001; not dropped here.
