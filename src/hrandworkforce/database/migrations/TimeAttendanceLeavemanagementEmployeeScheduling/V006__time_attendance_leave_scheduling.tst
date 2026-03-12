Title: Time & Attendance, Leave Management, and Employee Scheduling Schema – Documentation

Scope
- Domain: Operational time tracking, leave management, scheduling, timesheets, and overtime, within a multi-tenant HR system.
- Purpose: Provide structures for shift templates, attendance, leave, schedules, timesheets, and related approval workflows.
- Multitenancy: Tables include tenant_id; several tables reference employees and tenants for scoping.
- Governance: Audit fields and uniform updated_at triggers; generated columns for analytics; JSONB for flexible rules.

Database Extensions and Helpers
- uuid-ossp: UUID generation for primary keys.
- citext: Available for reuse where case-insensitive text is needed.
- update_updated_at_column(): Sets NEW.updated_at = CURRENT_TIMESTAMP on updates.

Enumerated Types
- attendance_status: present, absent, late, early_departure, half_day, holiday, leave, weekend, business_trip, training, offsite_work
- leave_request_status: pending, approved, rejected, cancelled, in_review
- timesheet_status: draft, submitted, approved, rejected, processed, paid
- schedule_status: draft, published, active, archived
- shift_status: scheduled, in_progress, completed, cancelled, no_show
- approval_status: pending, approved, rejected
- leave_accrual_type: annual, monthly, quarterly, hourly, none
- correction_type: clock_in, clock_out, break, status, hours

Tables and Structures
1) shift_templates
- Purpose: Standard shift blueprints with computed duration and break rules.
- Key columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - name, code (UNIQUE per tenant)
  - start_time TIME NOT NULL, end_time TIME NOT NULL
  - duration INTERVAL (generated, handles overnight shifts)
  - break_duration INTERVAL DEFAULT '1 hour'
  - break_rules JSONB, is_night_shift BOOLEAN, is_active BOOLEAN DEFAULT true
  - description TEXT
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - created_at, updated_at
- Constraints: UNIQUE(tenant_id, code)
- Trigger: update_shift_templates_updated_at

2) attendance_rules
- Purpose: Policy thresholds for lateness, early departure, rounding, overtime, and applicability.
- Key columns
  - id UUID PK
  - name, description
  - rules JSONB with late/early thresholds, roundingRules, overtimeRules, breakRules
  - applicability JSONB (allEmployees/departments/designations/locations)
  - effective_from DATE DEFAULT CURRENT_DATE, effective_to DATE, is_active BOOLEAN DEFAULT true
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - created_at, updated_at
- Trigger: update_attendance_rules_updated_at

3) attendance_records
- Purpose: Daily attendance combining scheduled vs actual punches, device/location, and computed hours.
- Key columns
  - id UUID PK
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - shift_template_id UUID REFERENCES shift_templates(id) ON DELETE SET NULL
  - record_date DATE NOT NULL
  - scheduled_start_time/end_time TIMESTAMPTZ; scheduled_break_duration INTERVAL
  - actual_clock_in/out TIMESTAMPTZ; break_start/end TIMESTAMPTZ
  - clock_in_location/clock_out_location/device_info JSONB; ip_address
  - status attendance_status DEFAULT 'present'
  - hours_worked, regular_hours, overtime_hours, break_duration INTERVAL
  - late_minutes, early_departure_minutes INT; normalized_hours DECIMAL(5,2)
  - record_dow/week/month SMALLINT (generated)
  - flags: is_auto_clock_out, requires_correction, is_verified; verified_by UUID, verified_at
  - notes TEXT, tenant_id UUID NOT NULL
  - created_at, updated_at
- Constraints: UNIQUE(employee_id, record_date); CHECK actual_clock_out >= actual_clock_in if present
- Indexes: idx_attendance_employee_date; idx_attendance_status; idx_attendance_tenant_date; idx_attendance_clock_times
- Triggers: update_attendance_records_updated_at; calculate_overtime_hours_trigger

4) attendance_corrections
- Purpose: Employee-raised corrections with approval workflow.
- Key columns
  - id UUID PK
  - attendance_record_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - correction_type correction_type NOT NULL
  - original_data JSONB NOT NULL; requested_data JSONB NOT NULL
  - reason TEXT NOT NULL; supporting_documents JSONB
  - status approval_status DEFAULT 'pending'; approver_id UUID; approval_date; approval_comments
  - tenant_id UUID NOT NULL; created_at, updated_at
- Trigger: update_attendance_corrections_updated_at

5) leave_types
- Purpose: Leave definitions with accrual and eligibility plus approval/workflow hints.
- Key columns
  - id UUID PK
  - name, code (UNIQUE per tenant)
  - description, color, is_paid, is_active, requires_approval, requires_document
  - max_consecutive_days, min_notice_days, max_advance_days
  - accrual_type leave_accrual_type DEFAULT 'annual'; accrual_rate; max_accrual
  - carry_over_enabled; max_carry_over; payout_on_termination
  - eligibility_rules JSONB; approval_workflow JSONB
  - tenant_id UUID NOT NULL; created_at, updated_at
- Trigger: update_leave_types_updated_at

6) leave_periods
- Purpose: Fiscal/operational periods governing leave accrual and carryover rules.
- Key columns
  - id UUID PK
  - name, start_date, end_date, is_current BOOLEAN DEFAULT false
  - accrual_settings JSONB (accrualFrequency, accrualDay, prorate rules, carryOverDeadline)
  - tenant_id UUID NOT NULL; created_at, updated_at
- Constraints: UNIQUE current period per tenant via uq_leave_period_current_per_tenant (partial)
- Trigger: update_leave_periods_updated_at

7) employee_leave_entitlements
- Purpose: Per-employee balances with generated balance_days column.
- Key columns
  - id UUID PK
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE
  - leave_period_id UUID NOT NULL REFERENCES leave_periods(id) ON DELETE CASCADE
  - entitled_days, accrued_days, used_days, carried_over_days, adjustment_days DECIMAL(5,2)
  - balance_days DECIMAL(5,2) GENERATED ALWAYS AS (...)
  - tenant_id UUID NOT NULL; created_at, updated_at
- Constraints: UNIQUE(employee_id, leave_type_id, leave_period_id)
- Indexes: idx_leave_entitlements_employee; idx_leave_entitlements_balance (expression)

8) leave_requests
- Purpose: Leave applications with half-day support, approval flow, and cover arrangements.
- Key columns
  - id UUID PK
  - employee_id, leave_type_id, leave_period_id UUID NOT NULL
  - start_date, end_date DATE; start_period, end_period VARCHAR(10) with checks
  - total_days DECIMAL(5,2) NOT NULL; reason TEXT
  - emergency_contact JSONB; status leave_request_status DEFAULT 'pending'
  - current_approver_id UUID; approval_workflow JSONB; documents JSONB
  - is_emergency BOOLEAN DEFAULT false; cover_employee_id UUID; cover_work_arrangements TEXT
  - tenant_id UUID NOT NULL; created_at, updated_at
- Indexes: idx_leave_requests_employee; idx_leave_requests_dates; idx_leave_requests_status
- Trigger: update_leave_requests_updated_at

9) leave_request_approvals
- Purpose: Approval audit trail with ordering and timestamps.
- Columns
  - id UUID PK
  - leave_request_id UUID NOT NULL; approver_id UUID NOT NULL; approval_order INT NOT NULL
  - status approval_status NOT NULL; comments TEXT; action_date TIMESTAMPTZ
  - tenant_id UUID NOT NULL; created_at, updated_at
- Trigger: update_leave_request_approvals_updated_at

10) holidays
- Purpose: Holidays/observances with applicability rules and computed year.
- Columns
  - id UUID PK; name VARCHAR(255) NOT NULL; date DATE NOT NULL
  - year INT GENERATED ALWAYS AS (EXTRACT(YEAR FROM date)) STORED
  - is_recurring BOOLEAN DEFAULT true; is_half_day BOOLEAN DEFAULT false; half_day_period with check
  - description TEXT; applicable_to JSONB
  - tenant_id UUID NOT NULL; created_at, updated_at
- Constraints: UNIQUE(tenant_id, date, name)
- Trigger: update_holidays_updated_at

11) schedules
- Purpose: Master schedule windows with publish tracking and coverage stats.
- Columns
  - id UUID PK; name VARCHAR(255) NOT NULL; description TEXT
  - period_start_date, period_end_date DATE NOT NULL
  - status schedule_status DEFAULT 'draft'; is_published BOOLEAN DEFAULT false
  - published_by UUID; published_at TIMESTAMPTZ
  - coverage_stats JSONB with total/scheduled/open/coveragePercentage
  - tenant_id UUID NOT NULL; created_by UUID
  - created_at, updated_at
- Indexes: idx_schedules_period; idx_schedules_status
- Trigger: update_schedules_updated_at

12) scheduled_shifts
- Purpose: Concrete shift assignments; links to attendance actuals.
- Columns
  - id UUID PK; schedule_id UUID NOT NULL; employee_id UUID NOT NULL
  - shift_template_id UUID; shift_date DATE NOT NULL
  - start_time, end_time TIMESTAMPTZ NOT NULL; break_duration INTERVAL
  - status shift_status DEFAULT 'scheduled'; notes TEXT
  - is_approved BOOLEAN DEFAULT false; approved_by UUID; approved_at TIMESTAMPTZ
  - actual_attendance_id UUID; tenant_id UUID NOT NULL
  - created_at, updated_at
- Indexes: idx_scheduled_shifts_employee; idx_scheduled_shifts_date; idx_scheduled_shifts_status
- Triggers: update_scheduled_shifts_updated_at; validate_schedule_conflict_trigger

13) shift_swaps
- Purpose: Employee-initiated shift swap requests with approval.
- Columns
  - id UUID PK; original_shift_id UUID NOT NULL; original_employee_id UUID NOT NULL
  - requested_employee_id UUID NOT NULL; status approval_status DEFAULT 'pending'
  - reason TEXT; approved_by UUID; approved_at TIMESTAMPTZ; tenant_id UUID NOT NULL
  - created_at, updated_at
- Indexes: idx_shift_swaps_original(original_employee_id)
- Trigger: update_shift_swaps_updated_at

14) time_off_requests
- Purpose: Time-off requests specific to scheduling conflicts (separate from leave module if desired).
- Columns
  - id UUID PK; employee_id UUID NOT NULL; schedule_id UUID
  - start_date, end_date DATE NOT NULL; reason TEXT
  - status approval_status DEFAULT 'pending'; approved_by UUID; approved_at TIMESTAMPTZ; tenant_id UUID NOT NULL
  - created_at, updated_at
- Trigger: update_time_off_requests_updated_at

15) timesheets
- Purpose: Consolidated work summaries across attendance/leave/holidays with approvals and processing state.
- Columns
  - id UUID PK; employee_id UUID NOT NULL; period_start_date, period_end_date DATE NOT NULL
  - status timesheet_status DEFAULT 'draft'
  - total_regular_hours, total_overtime_hours, total_break_hours, total_leave_hours, total_holiday_hours DECIMAL(8,2)
  - attendance_summary, leave_summary, holiday_summary JSONB; adjustments JSONB
  - approval_workflow JSONB; approved_by, processed_by UUID; approved_at, processed_at TIMESTAMPTZ; payroll_id VARCHAR(100)
  - tenant_id UUID NOT NULL; created_at, updated_at
- Constraints: UNIQUE(employee_id, period_start_date, period_end_date)
- Indexes: idx_timesheets_period; idx_timesheets_status; idx_timesheets_employee
- Trigger: update_timesheets_updated_at

16) overtime_requests
- Purpose: Authorization for OT with computed duration and rate.
- Columns
  - id UUID PK; employee_id UUID NOT NULL; schedule_id UUID
  - date DATE NOT NULL; start_time, end_time TIMESTAMPTZ NOT NULL; duration INTERVAL (generated)
  - reason TEXT NOT NULL; status approval_status DEFAULT 'pending'; approved_by UUID; approved_at TIMESTAMPTZ
  - overtime_rate DECIMAL(4,2) DEFAULT 1.5; calculated_amount DECIMAL(10,2)
  - tenant_id UUID NOT NULL; created_at, updated_at
- Indexes: idx_overtime_employee_date; idx_overtime_status
- Trigger: update_overtime_requests_updated_at

Functions & Triggers
- validate_schedule_conflict(): BEFORE INSERT/UPDATE on scheduled_shifts; prevents overlapping shifts, approved leave conflicts, and holiday conflicts for the same employee/date.
- update_attendance_from_leave(): AFTER UPDATE on leave_requests (when status transitions to approved) to set attendance_records.status = 'leave' for overlapping dates.
- calculate_overtime_hours(): BEFORE INSERT/UPDATE on attendance_records to compute hours_worked/normalized_hours and split into regular vs overtime based on attendance_rules.dailyThreshold (default 8 hrs).
- updated_at triggers: Applied to all module tables for consistent auditing.

Foreign Key Indexes
- attendance_records: fk_attendance_employee, fk_attendance_shift_template
- leave_requests: fk_leave_requests_employee, fk_leave_requests_type, fk_leave_requests_period
- scheduled_shifts: fk_scheduled_shifts_schedule, fk_scheduled_shifts_employee, fk_scheduled_shifts_template

Operational Notes
- JSONB rule/config fields allow flexible policies and targeted queries via GIN indexes if needed.
- Generated columns (day-of-week/week/month, duration, balance_days) enable efficient reporting.
- Conflict validation prevents scheduling errors and improves data integrity across modules.

End of documentation.