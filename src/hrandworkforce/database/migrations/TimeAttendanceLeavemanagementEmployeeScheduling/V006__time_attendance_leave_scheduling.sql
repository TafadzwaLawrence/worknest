-- module_tables.sql
-- Created: 2024-01-15
-- Description: Module-specific tables for Time & Attendance, Leave Management, and Employee Scheduling

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Additional extensions
CREATE EXTENSION IF NOT EXISTS citext;

-- Utility function: sets updated_at on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================
-- MODULE-SPECIFIC ENUM TYPES
-- ========================
CREATE TYPE attendance_status AS ENUM (
    'present', 'absent', 'late', 'early_departure', 'half_day',
    'holiday', 'leave', 'weekend', 'business_trip', 'training', 'offsite_work'
);

CREATE TYPE leave_request_status AS ENUM (
    'pending', 'approved', 'rejected', 'cancelled', 'in_review'
);

CREATE TYPE timesheet_status AS ENUM (
    'draft', 'submitted', 'approved', 'rejected', 'processed', 'paid'
);

CREATE TYPE schedule_status AS ENUM (
    'draft', 'published', 'active', 'archived'
);

CREATE TYPE shift_status AS ENUM (
    'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
);

CREATE TYPE approval_status AS ENUM (
    'pending', 'approved', 'rejected'
);

CREATE TYPE leave_accrual_type AS ENUM (
    'annual', 'monthly', 'quarterly', 'hourly', 'none'
);

CREATE TYPE correction_type AS ENUM (
    'clock_in', 'clock_out', 'break', 'status', 'hours'
);

-- ========================
-- TIME & ATTENDANCE MODULE
-- ========================

-- Shift Templates
/*
Table: shift_templates
Use: Standard shift blueprints including computed duration and break rules for scheduling and attendance.
Relationships: Referenced by scheduled_shifts and attendance_records (shift template context).
*/
CREATE TABLE shift_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    -- Handle overnight shifts: end_time before start_time implies next day
    duration INTERVAL GENERATED ALWAYS AS (
        CASE WHEN end_time >= start_time
             THEN (end_time - start_time)
             ELSE ((end_time + INTERVAL '24 hours')::time - start_time)
        END
    ) STORED,
    break_duration INTERVAL DEFAULT '1 hour',
    break_rules JSONB DEFAULT '{
        "autoDeduct": true,
        "minDuration": 30,
        "maxDuration": 120,
        "required": true
    }',
    is_night_shift BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

COMMENT ON TABLE shift_templates IS 'Standard shift templates for attendance tracking';

-- Attendance Rules
/*
Table: attendance_rules
Use: Policy thresholds for attendance evaluation, rounding, overtime, and applicability.
*/
CREATE TABLE attendance_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rules JSONB NOT NULL DEFAULT '{
        "lateThreshold": 15,
        "earlyDepartureThreshold": 15,
        "absentThreshold": 4,
        "roundingRules": {
            "clockInRound": 15,
            "clockOutRound": 15,
            "roundDirection": "nearest"
        },
        "overtimeRules": {
            "dailyThreshold": 8,
            "weeklyThreshold": 40,
            "calculationMethod": "daily"
        },
        "breakRules": {
            "minBreakBetweenShifts": 11,
            "maxConsecutiveDays": 6
        }
    }',
    applicability JSONB DEFAULT '{
        "allEmployees": true,
        "departments": [],
        "designations": [],
        "locations": []
    }',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE attendance_rules IS 'Attendance policy rules and thresholds';

-- Attendance Records
/*
Table: attendance_records
Use: Daily attendance with scheduled vs actual times, device/location, computed hours and flags.
Relationships: Links to employee and optional shift_template; verified_by for audit.
*/
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_template_id UUID REFERENCES shift_templates(id) ON DELETE SET NULL,
    record_date DATE NOT NULL,
    
    -- Scheduled times
    scheduled_start_time TIMESTAMP WITH TIME ZONE,
    scheduled_end_time TIMESTAMP WITH TIME ZONE,
    scheduled_break_duration INTERVAL,
    
    -- Actual times
    actual_clock_in TIMESTAMP WITH TIME ZONE,
    actual_clock_out TIMESTAMP WITH TIME ZONE,
    break_start TIMESTAMP WITH TIME ZONE,
    break_end TIMESTAMP WITH TIME ZONE,
    
    -- Location and device info
    clock_in_location JSONB,
    clock_out_location JSONB,
    device_info JSONB,
    ip_address VARCHAR(45),
    
    -- Status and calculations
    status attendance_status DEFAULT 'present',
    hours_worked INTERVAL,
    regular_hours INTERVAL,
    overtime_hours INTERVAL,
    break_duration INTERVAL,
    late_minutes INTEGER DEFAULT 0,
    early_departure_minutes INTEGER DEFAULT 0,
    normalized_hours DECIMAL(5,2),
    record_dow SMALLINT GENERATED ALWAYS AS (EXTRACT(ISODOW FROM record_date)) STORED,
    record_week SMALLINT GENERATED ALWAYS AS (EXTRACT(WEEK FROM record_date)) STORED,
    record_month SMALLINT GENERATED ALWAYS AS (EXTRACT(MONTH FROM record_date)) STORED,
    
    -- Flags and notes
    is_auto_clock_out BOOLEAN DEFAULT false,
    requires_correction BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id, record_date),
    CHECK (
        actual_clock_out IS NULL
        OR (actual_clock_in IS NOT NULL AND actual_clock_out >= actual_clock_in)
    )
);

COMMENT ON TABLE attendance_records IS 'Daily attendance records with detailed time tracking';

-- Attendance Corrections
/*
Table: attendance_corrections
Use: Employee-raised corrections with original/requested payload, approval state and docs.
Relationships: Links to attendance_records and employees.
*/
CREATE TABLE attendance_corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_record_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    correction_type correction_type NOT NULL,
    original_data JSONB NOT NULL,
    requested_data JSONB NOT NULL,
    reason TEXT NOT NULL,
    supporting_documents JSONB,
    status approval_status DEFAULT 'pending',
    approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    approval_date TIMESTAMP WITH TIME ZONE,
    approval_comments TEXT,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE attendance_corrections IS 'Attendance correction requests with approval workflow';

-- ========================
-- LEAVE MANAGEMENT MODULE
-- ========================

-- Leave Types
/*
Table: leave_types
Use: Leave definitions with accrual and eligibility; workflow hints and documents requirements.
*/
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3498db',
    is_paid BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT true,
    requires_document BOOLEAN DEFAULT false,
    max_consecutive_days INTEGER,
    min_notice_days INTEGER DEFAULT 1,
    max_advance_days INTEGER,
    accrual_type leave_accrual_type DEFAULT 'annual',
    accrual_rate DECIMAL(5,2) DEFAULT 1.0,
    max_accrual DECIMAL(5,2),
    carry_over_enabled BOOLEAN DEFAULT false,
    max_carry_over DECIMAL(5,2),
    payout_on_termination BOOLEAN DEFAULT false,
    eligibility_rules JSONB DEFAULT '{
        "minServiceDays": 90,
        "employmentTypes": ["full_time", "part_time"],
        "excludeDepartments": [],
        "excludeDesignations": []
    }',
    approval_workflow JSONB DEFAULT '{
        "levels": 1,
        "autoApprove": false,
        "approvers": []
    }',
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

COMMENT ON TABLE leave_types IS 'Leave type definitions with accrual and eligibility rules';

-- Leave Periods
/*
Table: leave_periods
Use: Fiscal/operational periods for leave accrual and carryover rules.
*/
CREATE TABLE leave_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    accrual_settings JSONB DEFAULT '{
        "accrualFrequency": "monthly",
        "accrualDay": 1,
        "prorateOnJoin": true,
        "prorateOnExit": true,
        "carryOverDeadline": "03-31"
    }',
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE leave_periods IS 'Leave calculation periods (typically fiscal years)';

-- Employee Leave Entitlements
/*
Table: employee_leave_entitlements
Use: Per-employee balances and auto-computed balance_days across accrual, usage, adjustments.
*/
CREATE TABLE employee_leave_entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    leave_period_id UUID NOT NULL REFERENCES leave_periods(id) ON DELETE CASCADE,
    entitled_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    accrued_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    used_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    carried_over_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    adjustment_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    balance_days DECIMAL(5,2) GENERATED ALWAYS AS (entitled_days + accrued_days + carried_over_days + adjustment_days - used_days) STORED,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id, leave_type_id, leave_period_id)
);

COMMENT ON TABLE employee_leave_entitlements IS 'Employee leave balances and accruals';

-- Leave Requests
/*
Table: leave_requests
Use: Leave applications including half-day handling, approval flow, and cover arrangements.
*/
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    leave_period_id UUID NOT NULL REFERENCES leave_periods(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_period VARCHAR(10) DEFAULT 'full_day' CHECK (start_period IN ('full_day', 'first_half', 'second_half')),
    end_period VARCHAR(10) DEFAULT 'full_day' CHECK (end_period IN ('full_day', 'first_half', 'second_half')),
    total_days DECIMAL(5,2) NOT NULL,
    reason TEXT NOT NULL,
    emergency_contact JSONB,
    status leave_request_status DEFAULT 'pending',
    current_approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    approval_workflow JSONB,
    documents JSONB,
    is_emergency BOOLEAN DEFAULT false,
    cover_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    cover_work_arrangements TEXT,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE leave_requests IS 'Leave applications with approval workflow';

-- Leave Request Approvals
/*
Table: leave_request_approvals
Use: Approval audit trail with ordering and timestamps.
*/
CREATE TABLE leave_request_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    approval_order INTEGER NOT NULL,
    status approval_status NOT NULL,
    comments TEXT,
    action_date TIMESTAMP WITH TIME ZONE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE leave_request_approvals IS 'Leave approval audit trail';

-- Holidays
/*
Table: holidays
Use: Holidays and observances with applicability rules; year computed from date.
*/
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM date)) STORED,
    is_recurring BOOLEAN DEFAULT true,
    is_half_day BOOLEAN DEFAULT false,
    half_day_period VARCHAR(10) CHECK (half_day_period IN ('first_half', 'second_half')),
    description TEXT,
    applicable_to JSONB DEFAULT '{
        "allEmployees": true,
        "departments": [],
        "locations": [],
        "employmentTypes": []
    }',
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, date, name)
);

COMMENT ON TABLE holidays IS 'Company holidays and observances';

-- ========================
-- EMPLOYEE SCHEDULING MODULE
-- ========================

-- Schedules
/*
Table: schedules
Use: Master schedule window with publish tracking and high-level coverage stats.
*/
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    status schedule_status DEFAULT 'draft',
    is_published BOOLEAN DEFAULT false,
    published_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    coverage_stats JSONB DEFAULT '{
        "totalShifts": 0,
        "scheduledShifts": 0,
        "openShifts": 0,
        "coveragePercentage": 0
    }',
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE schedules IS 'Master schedule for a specific period';

-- Scheduled Shifts
/*
Table: scheduled_shifts
Use: Concrete shift assignments with approvals, status, and link to attendance actuals.
*/
CREATE TABLE scheduled_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_template_id UUID REFERENCES shift_templates(id) ON DELETE SET NULL,
    shift_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    break_duration INTERVAL,
    status shift_status DEFAULT 'scheduled',
    notes TEXT,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    actual_attendance_id UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE scheduled_shifts IS 'Individual scheduled shifts for employees';

-- Shift Swaps
/*
Table: shift_swaps
Use: Employee-initiated swap requests for scheduled shifts; requires approval.
*/
CREATE TABLE shift_swaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_shift_id UUID NOT NULL REFERENCES scheduled_shifts(id) ON DELETE CASCADE,
    original_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    requested_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    status approval_status DEFAULT 'pending',
    reason TEXT,
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE shift_swaps IS 'Shift swap requests between employees';

-- Time Off Requests (for scheduling conflicts)
/*
Table: time_off_requests
Use: Scheduling-specific time-off requests to avoid conflicts; separate from leave module if desired.
*/
CREATE TABLE time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status approval_status DEFAULT 'pending',
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE time_off_requests IS 'Time off requests for scheduling conflicts';

-- ========================
-- TIMESHEET & REPORTING MODULE
-- ========================

-- Timesheets
/*
Table: timesheets
Use: Periodic consolidated work summaries across attendance/leave/holidays; approval and processing state.
*/
CREATE TABLE timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    status timesheet_status DEFAULT 'draft',
    
    -- Hours summary
    total_regular_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
    total_overtime_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
    total_break_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
    total_leave_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
    total_holiday_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
    
    -- Detailed breakdown
    attendance_summary JSONB NOT NULL,
    leave_summary JSONB NOT NULL,
    holiday_summary JSONB NOT NULL,
    adjustments JSONB,
    
    -- Approval workflow
    approval_workflow JSONB,
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    payroll_id VARCHAR(100),
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id, period_start_date, period_end_date)
);

COMMENT ON TABLE timesheets IS 'Consolidated timesheet data integrating attendance, leave, and scheduling';

-- Overtime Requests
/*
Table: overtime_requests
Use: Authorization for OT with computed duration and rate; feeds payroll.
*/
CREATE TABLE overtime_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTERVAL GENERATED ALWAYS AS (end_time - start_time) STORED,
    reason TEXT NOT NULL,
    status approval_status DEFAULT 'pending',
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    overtime_rate DECIMAL(4,2) DEFAULT 1.5,
    calculated_amount DECIMAL(10,2),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE overtime_requests IS 'Overtime work authorization and compensation';

-- ========================
-- INDEXES FOR MODULE TABLES
-- ========================

-- Attendance indexes
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, record_date);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_attendance_tenant_date ON attendance_records(tenant_id, record_date);
CREATE INDEX idx_attendance_clock_times ON attendance_records(actual_clock_in, actual_clock_out);

-- Leave indexes
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_entitlements_employee ON employee_leave_entitlements(employee_id);
CREATE INDEX idx_leave_entitlements_balance ON employee_leave_entitlements((balance_days > 0));
CREATE UNIQUE INDEX uq_leave_period_current_per_tenant ON leave_periods(tenant_id) WHERE is_current;

-- Scheduling indexes
CREATE INDEX idx_schedules_period ON schedules(period_start_date, period_end_date);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_scheduled_shifts_employee ON scheduled_shifts(employee_id);
CREATE INDEX idx_scheduled_shifts_date ON scheduled_shifts(shift_date);
CREATE INDEX idx_scheduled_shifts_status ON scheduled_shifts(status);
CREATE INDEX idx_shift_swaps_original ON shift_swaps(original_employee_id);

-- Timesheet indexes
CREATE INDEX idx_timesheets_period ON timesheets(period_start_date, period_end_date);
CREATE INDEX idx_timesheets_status ON timesheets(status);
CREATE INDEX idx_timesheets_employee ON timesheets(employee_id);

-- Overtime indexes
CREATE INDEX idx_overtime_employee_date ON overtime_requests(employee_id, date);
CREATE INDEX idx_overtime_status ON overtime_requests(status);

-- ========================
-- FOREIGN KEY INDEXES
-- ========================

-- Attendance foreign keys
CREATE INDEX fk_attendance_employee ON attendance_records(employee_id);
CREATE INDEX fk_attendance_shift_template ON attendance_records(shift_template_id);

-- Leave foreign keys
CREATE INDEX fk_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX fk_leave_requests_type ON leave_requests(leave_type_id);
CREATE INDEX fk_leave_requests_period ON leave_requests(leave_period_id);

-- Scheduling foreign keys
CREATE INDEX fk_scheduled_shifts_schedule ON scheduled_shifts(schedule_id);
CREATE INDEX fk_scheduled_shifts_employee ON scheduled_shifts(employee_id);
CREATE INDEX fk_scheduled_shifts_template ON scheduled_shifts(shift_template_id);

-- ========================
-- FUNCTIONS & TRIGGERS FOR MODULES
-- ========================

-- Function to validate schedule conflicts
CREATE OR REPLACE FUNCTION validate_schedule_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overlapping shifts
    IF EXISTS (
        SELECT 1 FROM scheduled_shifts ss
        WHERE ss.employee_id = NEW.employee_id
        AND ss.shift_date = NEW.shift_date
        AND ss.id != NEW.id
        AND ss.status NOT IN ('cancelled')
        AND (NEW.start_time, NEW.end_time) OVERLAPS (ss.start_time, ss.end_time)
    ) THEN
        RAISE EXCEPTION 'Schedule conflict: Employee already has a shift during this time';
    END IF;
    
    -- Check for approved leave requests
    IF EXISTS (
        SELECT 1 FROM leave_requests lr
        WHERE lr.employee_id = NEW.employee_id
        AND lr.status = 'approved'
        AND NEW.shift_date BETWEEN lr.start_date AND lr.end_date
    ) THEN
        RAISE EXCEPTION 'Schedule conflict: Employee is on approved leave during this time';
    END IF;
    
    -- Check for holidays
    IF EXISTS (
        SELECT 1 FROM holidays h
        WHERE h.date = NEW.shift_date
        AND h.tenant_id = NEW.tenant_id
        AND (
            h.applicable_to->>'allEmployees' = 'true' 
            OR NEW.employee_id IN (
                SELECT e.id FROM employees e
                WHERE e.tenant_id = NEW.tenant_id
                AND (
                    (h.applicable_to->'departments') ? e.department_id::text
                    OR (h.applicable_to->'locations') ? e.work_location_id::text
                )
            )
        )
    ) THEN
        RAISE EXCEPTION 'Schedule conflict: Company holiday on this date';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_schedule_conflict_trigger
BEFORE INSERT OR UPDATE ON scheduled_shifts
FOR EACH ROW EXECUTE FUNCTION validate_schedule_conflict();

-- Function to update attendance record status based on leave
CREATE OR REPLACE FUNCTION update_attendance_from_leave()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' THEN
        -- Update attendance records to show leave status
        UPDATE attendance_records 
        SET status = 'leave'
        WHERE employee_id = NEW.employee_id
        AND record_date BETWEEN NEW.start_date AND NEW.end_date
        AND tenant_id = NEW.tenant_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_attendance_from_leave_trigger
AFTER UPDATE ON leave_requests
FOR EACH ROW
WHEN (OLD.status != 'approved' AND NEW.status = 'approved')
EXECUTE FUNCTION update_attendance_from_leave();

-- Function to calculate overtime hours
CREATE OR REPLACE FUNCTION calculate_overtime_hours()
RETURNS TRIGGER AS $$
DECLARE
    daily_thresh_hours NUMERIC := 8;
    daily_threshold INTERVAL := INTERVAL '8 hours';
    regular_hours INTERVAL := INTERVAL '0 hours';
    overtime INTERVAL := INTERVAL '0 hours';
    hrs NUMERIC;
    mins NUMERIC;
    temp_interval INTERVAL;
BEGIN
    -- Attempt to read daily threshold from latest active attendance_rules
    SELECT COALESCE((ar.rules->'overtimeRules'->>'dailyThreshold')::numeric, 8)
    INTO daily_thresh_hours
    FROM attendance_rules ar
    WHERE ar.tenant_id = NEW.tenant_id AND ar.is_active = true
    ORDER BY ar.effective_from DESC
    LIMIT 1;

    hrs := floor(daily_thresh_hours);
    mins := round((daily_thresh_hours - floor(daily_thresh_hours)) * 60);
    daily_threshold := make_interval(hours => hrs::int, mins => mins::int);

    -- If hours_worked not set, compute from clock in/out minus break
    IF NEW.actual_clock_in IS NOT NULL AND NEW.actual_clock_out IS NOT NULL THEN
        temp_interval := NEW.actual_clock_out - NEW.actual_clock_in;
        IF NEW.break_duration IS NOT NULL THEN
            temp_interval := temp_interval - NEW.break_duration;
        END IF;
        NEW.hours_worked := temp_interval;
        NEW.normalized_hours := EXTRACT(EPOCH FROM temp_interval) / 3600.0;
    END IF;

    IF NEW.hours_worked IS NOT NULL AND NEW.hours_worked > daily_threshold THEN
        overtime := NEW.hours_worked - daily_threshold;
        regular_hours := daily_threshold;
    ELSE
        overtime := INTERVAL '0 hours';
        regular_hours := COALESCE(NEW.hours_worked, INTERVAL '0 hours');
    END IF;

    NEW.regular_hours := regular_hours;
    NEW.overtime_hours := overtime;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_overtime_hours_trigger
BEFORE INSERT OR UPDATE ON attendance_records
FOR EACH ROW
WHEN (NEW.actual_clock_out IS NOT NULL)
EXECUTE FUNCTION calculate_overtime_hours();

-- Apply updated_at triggers to module tables
CREATE TRIGGER update_shift_templates_updated_at BEFORE UPDATE ON shift_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_rules_updated_at BEFORE UPDATE ON attendance_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_corrections_updated_at BEFORE UPDATE ON attendance_corrections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_types_updated_at BEFORE UPDATE ON leave_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_periods_updated_at BEFORE UPDATE ON leave_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_request_approvals_updated_at BEFORE UPDATE ON leave_request_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_shifts_updated_at BEFORE UPDATE ON scheduled_shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_swaps_updated_at BEFORE UPDATE ON shift_swaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_off_requests_updated_at BEFORE UPDATE ON time_off_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Employee Management triggers (wrap duplicates from V001 with DROP IF EXISTS)
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_designations_updated_at ON designations;
CREATE TRIGGER update_designations_updated_at BEFORE UPDATE ON designations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_addresses_updated_at BEFORE UPDATE ON employee_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_contacts_updated_at BEFORE UPDATE ON employee_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- ROW-LEVEL SECURITY (RLS)
-- ====================================
ALTER TABLE shift_templates              ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_rules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_corrections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_periods                ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_leave_entitlements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests               ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_request_approvals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_shifts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swaps                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_requests            ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON shift_templates             USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON attendance_rules            USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON attendance_records          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON attendance_corrections      USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON leave_types                 USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON leave_periods               USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON employee_leave_entitlements USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON leave_requests              USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON leave_request_approvals     USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON holidays                    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON schedules                   USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON scheduled_shifts            USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON shift_swaps                 USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON time_off_requests           USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON timesheets                  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON overtime_requests           USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);