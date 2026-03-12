-- =====================
-- EMPLOYEE ONBOARDING & OFFBOARDING SCHEMA (Workforce Operations & Management)
-- Extends the existing HR & Workforce Management System
-- Design principles:
--   - Single shared-database multi-tenant model (tenant_id UUID on tenant-scoped tables)
--   - Strong tenant isolation checks via FK + trigger-based tenant-consistency validation
--   - Soft deletes (deleted_at), audit fields, and explicit updated_at triggers
--   - Clear relationships to Recruitment (applicants, applications, offers) and Employees
--   - Template-driven onboarding/offboarding cases and tasks; provisioning/access and asset returns
--   - Optional linkage with workflow instances (from workflows.sql) for approvals/SLA
-- =====================

-- =====================
-- EXTENSIONS & HELPERS
-- =====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

-- Utility function: sets updated_at on row updates (uniform pattern)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Helper to fetch tenant_id for a given table/id (safe wrapper, reused across modules)
CREATE OR REPLACE FUNCTION _get_tenant_id_for(table_name TEXT, row_id UUID) RETURNS UUID AS $$
DECLARE
    tenant UUID;
    sql TEXT;
BEGIN
    sql := format('SELECT tenant_id FROM %I WHERE id = $1', table_name);
    EXECUTE sql INTO tenant USING row_id;
    RETURN tenant;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- ENUMS / TYPE DEFINITIONS
-- =====================
DO $$ BEGIN CREATE TYPE onboarding_status AS ENUM ('planned','active','on_hold','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE offboarding_status AS ENUM ('planned','active','on_hold','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE task_status AS ENUM ('pending','in_progress','blocked','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE case_type AS ENUM ('onboarding','offboarding'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE priority_level AS ENUM ('low','normal','high','urgent'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE provision_status AS ENUM ('requested','approved','provisioned','revoked','rejected','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE asset_type AS ENUM ('laptop','desktop','mobile','access_card','key','software_license','other'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
-- note_visibility is defined in V003 (recruitment); duplicate_object guard handles idempotency
DO $$ BEGIN CREATE TYPE note_visibility AS ENUM ('private','team','public'); EXCEPTION WHEN duplicate_object THEN null; END; $$;

/*
====================================
ONBOARDING/OFFBOARDING DOMAIN GROUPS
- Templates: onboarding_templates, onboarding_template_tasks, offboarding_templates, offboarding_template_tasks
- Cases: onboarding_cases, onboarding_case_tasks, offboarding_cases, offboarding_case_tasks
- Provisioning/Access & Assets: provisioning_requests, asset_assignments
- Exit & Knowledge Transfer: exit_interviews, knowledge_transfer_records, clearance_checklist_items
- Collaboration: onboarding_notes, offboarding_notes
- Ops/Indexes/Triggers: performance indexes, tenant validation, and explicit updated_at triggers
====================================
*/

-- =====================
-- TEMPLATES
-- =====================
/*
Table: onboarding_templates
Use: Defines reusable onboarding plan templates with default tasks.
Relationships: onboarding_template_tasks reference onboarding_templates.
Implementation: Unique (tenant_id, name) to avoid duplicates.
*/
CREATE TABLE IF NOT EXISTS onboarding_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

/*
Table: onboarding_template_tasks
Use: Defines tasks within an onboarding template with relative day offsets.
Relationships: FK to onboarding_templates.
*/
CREATE TABLE IF NOT EXISTS onboarding_template_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    relative_day_offset INT DEFAULT 0, -- days from case start_date
    priority priority_level DEFAULT 'normal',
    required BOOLEAN DEFAULT true,
    assigned_to_type TEXT, -- 'user','role','department','manager','it','hr'
    assigned_to_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (template_id, name)
);

/*
Table: offboarding_templates
Use: Defines reusable offboarding plan templates with default tasks.
Relationships: offboarding_template_tasks reference offboarding_templates.
*/
CREATE TABLE IF NOT EXISTS offboarding_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

/*
Table: offboarding_template_tasks
Use: Defines tasks within an offboarding template with relative day offsets.
Relationships: FK to offboarding_templates.
*/
CREATE TABLE IF NOT EXISTS offboarding_template_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES offboarding_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    relative_day_offset INT DEFAULT 0, -- days from case start_date or last_working_day negative
    priority priority_level DEFAULT 'normal',
    required BOOLEAN DEFAULT true,
    assigned_to_type TEXT, -- 'user','role','department','manager','it','hr'
    assigned_to_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (template_id, name)
);

-- =====================
-- CASES (ONBOARDING)
-- =====================
/*
Table: onboarding_cases
Use: Instance of an onboarding plan for a new hire transitioning from recruitment to employment.
Relationships: Links to recruitment (applicants, applications, offers) and to employees; optional template & workflow.
Implementation: Tenant validation ensures cross-module references belong to same tenant.
*/
CREATE TABLE IF NOT EXISTS onboarding_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID REFERENCES onboarding_templates(id) ON DELETE SET NULL,
    applicant_id UUID REFERENCES applicants(id) ON DELETE SET NULL,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_completion_date DATE,
    status onboarding_status DEFAULT 'planned',
    workflow_instance_id UUID, -- references workflows.workflow_instances(id), optional
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

/*
Table: onboarding_case_tasks
Use: Tasks instantiated for a specific onboarding case with assignees and scheduling.
Relationships: FK to onboarding_cases and optional template task.
*/
CREATE TABLE IF NOT EXISTS onboarding_case_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE,
    template_task_id UUID REFERENCES onboarding_template_tasks(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pending',
    priority priority_level DEFAULT 'normal',
    assignee_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assignee_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    blocked_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- =====================
-- CASES (OFFBOARDING)
-- =====================
/*
Table: offboarding_cases
Use: Instance of an offboarding plan for a departing employee.
Relationships: Links to employees; optional recruitment links and workflow.
*/
CREATE TABLE IF NOT EXISTS offboarding_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID REFERENCES offboarding_templates(id) ON DELETE SET NULL,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    initiator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    exit_type TEXT, -- 'resignation','termination','retirement','layoff','contract_end'
    reason TEXT,
    last_working_day DATE NOT NULL,
    rehire_eligible BOOLEAN DEFAULT true,
    status offboarding_status DEFAULT 'planned',
    workflow_instance_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

/*
Table: offboarding_case_tasks
Use: Tasks instantiated for a specific offboarding case with assignees and scheduling.
Relationships: FK to offboarding_cases and optional template task.
*/
CREATE TABLE IF NOT EXISTS offboarding_case_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES offboarding_cases(id) ON DELETE CASCADE,
    template_task_id UUID REFERENCES offboarding_template_tasks(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pending',
    priority priority_level DEFAULT 'normal',
    assignee_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assignee_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    blocked_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- =====================
-- PROVISIONING / ACCESS & ASSETS
-- =====================
/*
Table: provisioning_requests
Use: Tracks access/hardware/software provisioning for onboarding/offboarding.
Relationships: Polymorphic to case via (case_type, case_id); references employees/users for actor/subject.
*/
CREATE TABLE IF NOT EXISTS provisioning_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    case_type case_type NOT NULL,
    case_id UUID NOT NULL,
    request_type TEXT NOT NULL, -- 'account','system_access','hardware','software','license','badge','email','vpn'
    target_system TEXT,
    requested_for_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status provision_status DEFAULT 'requested',
    details JSONB DEFAULT '{}'::jsonb,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    provisioned_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/*
Table: asset_assignments
Use: Tracks issued assets and their return during offboarding.
Relationships: Links to employee and optionally to a case via (case_type, case_id).
*/
CREATE TABLE IF NOT EXISTS asset_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    case_type case_type,
    case_id UUID,
    asset_type asset_type NOT NULL,
    asset_tag TEXT, -- inventory tag
    serial_number TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_return_at TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,
    condition_on_return TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- EXIT & KNOWLEDGE TRANSFER
-- =====================
/*
Table: exit_interviews
Use: Schedules and stores exit interview details for offboarding cases.
*/
CREATE TABLE IF NOT EXISTS exit_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    offboarding_case_id UUID NOT NULL REFERENCES offboarding_cases(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ,
    interviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    interviewer_notes TEXT,
    rating INT CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/*
Table: knowledge_transfer_records
Use: Tracks knowledge transfer items between departing and successor employees.
*/
CREATE TABLE IF NOT EXISTS knowledge_transfer_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    offboarding_case_id UUID NOT NULL REFERENCES offboarding_cases(id) ON DELETE CASCADE,
    from_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    to_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/*
Table: clearance_checklist_items
Use: Departmental offboarding clearance checklist (e.g., HR, IT, Facilities).
*/
CREATE TABLE IF NOT EXISTS clearance_checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    offboarding_case_id UUID NOT NULL REFERENCES offboarding_cases(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    status task_status DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- COLLABORATION (NOTES)
-- =====================
/*
Table: onboarding_notes
Use: Notes for onboarding cases with visibility control.
*/
CREATE TABLE IF NOT EXISTS onboarding_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    visibility note_visibility DEFAULT 'private',
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/*
Table: offboarding_notes
Use: Notes for offboarding cases with visibility control.
*/
CREATE TABLE IF NOT EXISTS offboarding_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES offboarding_cases(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    visibility note_visibility DEFAULT 'private',
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- INDEXES
-- =====================
-- Templates
CREATE INDEX IF NOT EXISTS idx_onboarding_templates_tenant ON onboarding_templates (tenant_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_templates_tenant ON offboarding_templates (tenant_id);

-- Cases
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_tenant_status ON onboarding_cases (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_dates ON onboarding_cases (tenant_id, start_date, target_completion_date);
CREATE INDEX IF NOT EXISTS idx_offboarding_cases_tenant_status ON offboarding_cases (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_offboarding_cases_last_day ON offboarding_cases (tenant_id, last_working_day);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_onboarding_case_tasks_status ON onboarding_case_tasks (tenant_id, case_id, status);
CREATE INDEX IF NOT EXISTS idx_onboarding_case_tasks_due ON onboarding_case_tasks (tenant_id, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_offboarding_case_tasks_status ON offboarding_case_tasks (tenant_id, case_id, status);
CREATE INDEX IF NOT EXISTS idx_offboarding_case_tasks_due ON offboarding_case_tasks (tenant_id, due_date) WHERE deleted_at IS NULL;

-- Provisioning & Assets
CREATE INDEX IF NOT EXISTS idx_provisioning_requests_status ON provisioning_requests (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_provisioning_requests_case ON provisioning_requests (tenant_id, case_type, case_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_employee ON asset_assignments (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_return_pending ON asset_assignments (tenant_id) WHERE returned_at IS NULL;

-- Exit & KT
CREATE INDEX IF NOT EXISTS idx_exit_interviews_case ON exit_interviews (tenant_id, offboarding_case_id);
CREATE INDEX IF NOT EXISTS idx_kt_records_case ON knowledge_transfer_records (tenant_id, offboarding_case_id);
CREATE INDEX IF NOT EXISTS idx_clearance_items_case ON clearance_checklist_items (tenant_id, offboarding_case_id);

-- Notes
CREATE INDEX IF NOT EXISTS idx_onboarding_notes_case ON onboarding_notes (tenant_id, case_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_notes_case ON offboarding_notes (tenant_id, case_id);

-- =====================
-- TRIGGERS & FUNCTIONS (VALIDATION & AUDIT)
-- =====================
-- updated_at triggers
CREATE TRIGGER update_onboarding_templates_updated_at BEFORE UPDATE ON onboarding_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_template_tasks_updated_at BEFORE UPDATE ON onboarding_template_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offboarding_templates_updated_at BEFORE UPDATE ON offboarding_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offboarding_template_tasks_updated_at BEFORE UPDATE ON offboarding_template_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_cases_updated_at BEFORE UPDATE ON onboarding_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_case_tasks_updated_at BEFORE UPDATE ON onboarding_case_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offboarding_cases_updated_at BEFORE UPDATE ON offboarding_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offboarding_case_tasks_updated_at BEFORE UPDATE ON offboarding_case_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provisioning_requests_updated_at BEFORE UPDATE ON provisioning_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_assignments_updated_at BEFORE UPDATE ON asset_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exit_interviews_updated_at BEFORE UPDATE ON exit_interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kt_records_updated_at BEFORE UPDATE ON knowledge_transfer_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clearance_items_updated_at BEFORE UPDATE ON clearance_checklist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_notes_updated_at BEFORE UPDATE ON onboarding_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offboarding_notes_updated_at BEFORE UPDATE ON offboarding_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tenant validation: ensure cross-module references belong to same tenant
CREATE OR REPLACE FUNCTION trg_validate_onboarding_case_tenant() RETURNS trigger AS $$
DECLARE a_t UUID; app_t UUID; off_t UUID; emp_t UUID;
BEGIN
    IF NEW.applicant_id IS NOT NULL THEN
        a_t := _get_tenant_id_for('applicants', NEW.applicant_id);
        IF a_t IS NULL OR a_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch for applicant'; END IF;
    END IF;
    IF NEW.application_id IS NOT NULL THEN
        app_t := _get_tenant_id_for('applications', NEW.application_id);
        IF app_t IS NULL OR app_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch for application'; END IF;
    END IF;
    IF NEW.offer_id IS NOT NULL THEN
        off_t := _get_tenant_id_for('offers', NEW.offer_id);
        IF off_t IS NULL OR off_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch for offer'; END IF;
    END IF;
    IF NEW.employee_id IS NOT NULL THEN
        emp_t := _get_tenant_id_for('employees', NEW.employee_id);
        IF emp_t IS NULL OR emp_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch for employee'; END IF;
    END IF;
    RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_onboarding_case_tenant ON onboarding_cases;
CREATE TRIGGER trg_onboarding_case_tenant BEFORE INSERT OR UPDATE ON onboarding_cases FOR EACH ROW EXECUTE PROCEDURE trg_validate_onboarding_case_tenant();

CREATE OR REPLACE FUNCTION trg_validate_offboarding_case_tenant() RETURNS trigger AS $$
DECLARE emp_t UUID;
BEGIN
    emp_t := _get_tenant_id_for('employees', NEW.employee_id);
    IF emp_t IS NULL OR emp_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch for employee'; END IF;
    RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_offboarding_case_tenant ON offboarding_cases;
CREATE TRIGGER trg_offboarding_case_tenant BEFORE INSERT OR UPDATE ON offboarding_cases FOR EACH ROW EXECUTE PROCEDURE trg_validate_offboarding_case_tenant();

CREATE OR REPLACE FUNCTION trg_validate_case_task_tenant() RETURNS trigger AS $$
DECLARE c_t UUID;
BEGIN
    -- Determine table from TG_TABLE_NAME
    IF TG_TABLE_NAME = 'onboarding_case_tasks' THEN
        c_t := _get_tenant_id_for('onboarding_cases', NEW.case_id);
    ELSE
        c_t := _get_tenant_id_for('offboarding_cases', NEW.case_id);
    END IF;
    IF c_t IS NULL OR c_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between case task and case'; END IF;
    RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_onboarding_case_task_tenant ON onboarding_case_tasks;
CREATE TRIGGER trg_onboarding_case_task_tenant BEFORE INSERT OR UPDATE ON onboarding_case_tasks FOR EACH ROW EXECUTE PROCEDURE trg_validate_case_task_tenant();

DROP TRIGGER IF EXISTS trg_offboarding_case_task_tenant ON offboarding_case_tasks;
CREATE TRIGGER trg_offboarding_case_task_tenant BEFORE INSERT OR UPDATE ON offboarding_case_tasks FOR EACH ROW EXECUTE PROCEDURE trg_validate_case_task_tenant();

CREATE OR REPLACE FUNCTION trg_validate_provisioning_request_tenant() RETURNS trigger AS $$
DECLARE c_t UUID;
BEGIN
    IF NEW.case_type = 'onboarding' THEN
        c_t := _get_tenant_id_for('onboarding_cases', NEW.case_id);
    ELSE
        c_t := _get_tenant_id_for('offboarding_cases', NEW.case_id);
    END IF;
    IF c_t IS NULL OR c_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch for provisioning_request'; END IF;
    RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_provisioning_request_tenant ON provisioning_requests;
CREATE TRIGGER trg_provisioning_request_tenant BEFORE INSERT OR UPDATE ON provisioning_requests FOR EACH ROW EXECUTE PROCEDURE trg_validate_provisioning_request_tenant();

CREATE OR REPLACE FUNCTION trg_validate_asset_assignment_tenant() RETURNS trigger AS $$
DECLARE e_t UUID;
BEGIN
    e_t := _get_tenant_id_for('employees', NEW.employee_id);
    IF e_t IS NULL OR e_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch for asset assignment'; END IF;
    RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_asset_assignment_tenant ON asset_assignments;
CREATE TRIGGER trg_asset_assignment_tenant BEFORE INSERT OR UPDATE ON asset_assignments FOR EACH ROW EXECUTE PROCEDURE trg_validate_asset_assignment_tenant();

-- =====================
-- REPORTING VIEWS
-- =====================
CREATE OR REPLACE VIEW onboarding_case_overview AS
SELECT oc.*, 
       a.first_name || ' ' || a.last_name AS applicant_name,
       e.first_name || ' ' || e.last_name AS employee_name,
       (SELECT COUNT(*) FROM onboarding_case_tasks t WHERE t.case_id = oc.id AND t.status <> 'completed') AS open_tasks,
       (SELECT COUNT(*) FROM onboarding_case_tasks t WHERE t.case_id = oc.id AND t.status = 'completed') AS completed_tasks
FROM onboarding_cases oc
LEFT JOIN applicants a ON oc.applicant_id = a.id
LEFT JOIN employees e ON oc.employee_id = e.id;

CREATE OR REPLACE VIEW offboarding_case_overview AS
SELECT oc.*, 
       e.first_name || ' ' || e.last_name AS employee_name,
       (SELECT COUNT(*) FROM offboarding_case_tasks t WHERE t.case_id = oc.id AND t.status <> 'completed') AS open_tasks,
       (SELECT COUNT(*) FROM offboarding_case_tasks t WHERE t.case_id = oc.id AND t.status = 'completed') AS completed_tasks
FROM offboarding_cases oc
LEFT JOIN employees e ON oc.employee_id = e.id;

-- End of Employee Onboarding & Offboarding schema
