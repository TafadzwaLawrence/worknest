-- =====================
-- WORKFLOW MANAGEMENT SCHEMA
-- Extends the existing HR & Workforce Management System
-- Design principles:
--   - Flexible workflow engine for various HR processes
--   - Support for approval chains, notifications, and escalations
--   - Multi-tenant architecture with tenant isolation
--   - Audit trails and version history
--   - Integration with existing HR entities
-- =====================

-- =====================
-- ENUMS / TYPE DEFINITIONS
-- =====================
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

DO $$ BEGIN CREATE TYPE workflow_status AS ENUM ('draft', 'active', 'paused', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE instance_status AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'escalated', 'completed'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE step_type AS ENUM ('approval', 'review', 'notification', 'task', 'condition', 'automation'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE approval_action AS ENUM ('approve', 'reject', 'request_changes', 'delegate', 'escalate'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE assignment_type AS ENUM ('user', 'role', 'department', 'dynamic', 'reporting_manager', 'specific_position'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE condition_operator AS ENUM ('equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'starts_with', 'ends_with', 'in', 'not_in'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE escalation_strategy AS ENUM ('next_level', 'specific_user', 'role_based', 'time_based', 'multiple_approvers'); EXCEPTION WHEN duplicate_object THEN null; END; $$;

-- =====================
-- WORKFLOW DEFINITIONS
-- =====================

-- Workflow templates
/*
Table: workflows
Use: Workflow template/definition per tenant with category and entity scope; supports versioning.
Relationships: workflow_steps reference workflows; workflow_versions snapshot definitions.
Implementation: conditions JSONB for preconditions; unique (tenant_id, name, version).
*/
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'recruitment', 'onboarding', 'leave', 'expense', 'performance', 'offboarding'
    entity_type TEXT NOT NULL, -- References the entity this workflow manages (e.g., 'leave_requests', 'expense_reports')
    version INT NOT NULL DEFAULT 1,
    status workflow_status DEFAULT 'draft',
    is_default BOOLEAN DEFAULT false,
    conditions JSONB, -- Pre-conditions for workflow initiation
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name, version)
);

-- Workflow steps
/*
Table: workflow_steps
Use: Defines ordered steps in a workflow (approval/review/notification/task/condition/automation).
Relationships: Referenced by assignments and rules; instances reference current step.
*/
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    step_type step_type NOT NULL,
    position INT NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    timeout_hours INT, -- Time before escalation
    approval_threshold NUMERIC(5,2) DEFAULT 100, -- Percentage required for approval
    actions_allowed approval_action[], -- Allowed actions for this step
    conditions JSONB, -- Step-specific conditions
    instructions TEXT, -- Instructions for approvers/reviewers
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Step assignments (who can action each step)
/*
Table: step_assignments
Use: Who can act at a step (user/role/department/dynamic/reporting_manager/specific_position) with priority.
Relationships: References workflow_steps via step_id; fallback assignee optional.
*/
CREATE TABLE IF NOT EXISTS step_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
    assignment_type assignment_type NOT NULL,
    assignee_id UUID, -- Could be user_id, role_id, department_id, etc.
    assignee_value TEXT, -- For dynamic assignments (e.g., "reporting_manager")
    fallback_assignee_id UUID, -- Fallback if primary assignee unavailable
    priority INT DEFAULT 0, -- Order of assignment precedence
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Escalation rules
/*
Table: escalation_rules
Use: Escalate pending steps after timeout using a strategy (next level/specific user/role/time_based).
Relationships: References workflow_steps via step_id; used by escalation job.
*/
CREATE TABLE IF NOT EXISTS escalation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
    strategy escalation_strategy NOT NULL,
    after_hours INT NOT NULL, -- Escalate after X hours of inactivity
    target_type assignment_type NOT NULL,
    target_id UUID,
    target_value TEXT,
    max_escalations INT DEFAULT 3,
    notify_original_assignee BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- =====================
-- WORKFLOW INSTANCES & EXECUTION
-- =====================

-- Workflow instances (each running workflow)
/*
Table: workflow_instances
Use: Running instance of a workflow bound to an entity record with priority/SLA.
Relationships: References workflows; current_step_id references workflow_steps.
*/
CREATE TABLE IF NOT EXISTS workflow_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL, -- The entity being processed (e.g., leave_request_id)
    entity_type TEXT NOT NULL,
    initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    status instance_status DEFAULT 'pending',
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Instance steps (tracking progress through workflow)
/*
Table: instance_steps
Use: Tracks assignment, status, timing, and actions for each step occurrence in an instance.
Relationships: References workflow_instances and workflow_steps; escalated_from links lineage.
*/
CREATE TABLE IF NOT EXISTS instance_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    status instance_status DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    action_taken approval_action,
    comments TEXT,
    time_taken_seconds INT,
    escalated_from UUID REFERENCES instance_steps(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step actions (detailed history of each action)
/*
Table: step_actions
Use: Append-only action history for steps (approve/reject/request_changes/delegate/escalate) with actor and payload.
*/
CREATE TABLE IF NOT EXISTS step_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    instance_step_id UUID NOT NULL REFERENCES instance_steps(id) ON DELETE CASCADE,
    action_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_taken approval_action NOT NULL,
    comments TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step delegations
/*
Table: step_delegations
Use: Delegates a specific instance_step from original assignee to another user for a date window.
*/
CREATE TABLE IF NOT EXISTS step_delegations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    instance_step_id UUID NOT NULL REFERENCES instance_steps(id) ON DELETE CASCADE,
    original_assignee UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delegated_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- NOTIFICATIONS & COMMUNICATIONS
-- =====================

-- Workflow notifications
/*
Table: workflow_notifications
Use: Records notifications for workflow events (assignment/reminder/escalation/completion/cancellation).
*/
CREATE TABLE IF NOT EXISTS workflow_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
    instance_step_id UUID REFERENCES instance_steps(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'assignment', 'reminder', 'escalation', 'completion', 'cancellation'
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    action_required BOOLEAN DEFAULT false,
    action_url TEXT,
    sent_via TEXT[], -- 'email', 'in_app', 'push', 'sms'
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notification templates
/*
Table: notification_templates
Use: Templates for workflow notifications with variables.
*/
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    notification_type TEXT NOT NULL,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    variables JSONB, -- Available template variables
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

-- =====================
-- WORKFLOW CONDITIONS & RULES
-- =====================

-- Condition definitions
/*
Table: workflow_conditions
Use: Declarative conditions for preconditions/routing/validation on an entity field path.
*/
CREATE TABLE IF NOT EXISTS workflow_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    condition_type TEXT NOT NULL, -- 'precondition', 'routing', 'validation'
    entity_type TEXT NOT NULL,
    field_path TEXT NOT NULL, -- JSON path to the field being evaluated
    operator condition_operator NOT NULL,
    comparison_value TEXT,
    comparison_values TEXT[], -- For 'in' and 'not_in' operators
    error_message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Condition groups (for complex logic)
/*
Table: condition_groups
Use: Groups conditions using logical_operator (AND/OR) for complex logic.
*/
CREATE TABLE IF NOT EXISTS condition_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    logical_operator TEXT NOT NULL DEFAULT 'AND', -- 'AND', 'OR'
    conditions JSONB, -- Array of condition IDs or nested conditions
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- =====================
-- WORKFLOW ANALYTICS & REPORTING
-- =====================

-- Workflow metrics
/*
Table: workflow_metrics
Use: Aggregated workflow metrics by period for analytics (throughput, completion time, rates).
*/
CREATE TABLE IF NOT EXISTS workflow_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_instances INT DEFAULT 0,
    completed_instances INT DEFAULT 0,
    avg_completion_time_seconds INT DEFAULT 0,
    approval_rate NUMERIC(5,2) DEFAULT 0,
    rejection_rate NUMERIC(5,2) DEFAULT 0,
    escalation_rate NUMERIC(5,2) DEFAULT 0,
    avg_steps_per_instance NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, workflow_id, period_start)
);

-- Step performance metrics
/*
Table: step_metrics
Use: Aggregated per-step metrics (assignments, completions, escalations, delegations, timing) by period.
*/
CREATE TABLE IF NOT EXISTS step_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_assignments INT DEFAULT 0,
    avg_completion_time_seconds INT DEFAULT 0,
    approval_count INT DEFAULT 0,
    rejection_count INT DEFAULT 0,
    escalation_count INT DEFAULT 0,
    delegation_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, step_id, period_start)
);

-- =====================
-- INTEGRATION WITH EXISTING HR ENTITIES
-- =====================

-- Leave request workflow integration
/*
Table: leave_request_workflows
Use: Link between leave requests and workflow instances for approval tracking.
*/
CREATE TABLE IF NOT EXISTS leave_request_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    leave_request_id UUID NOT NULL, -- References external leave_requests table
    workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, leave_request_id)
);

-- Expense approval workflow integration
/*
Table: expense_workflows
Use: Link between expense reports and workflow instances for approval tracking.
*/
CREATE TABLE IF NOT EXISTS expense_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    expense_report_id UUID NOT NULL, -- References external expense_reports table
    workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, expense_report_id)
);

-- Recruitment workflow integration
/*
Table: recruitment_workflows
Use: Link between recruitment applications and workflow instances for approval/processing stages.
*/
CREATE TABLE IF NOT EXISTS recruitment_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, application_id)
);

-- =====================
-- INDEXES
-- =====================

-- Workflow definitions
CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows (tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows (tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows (tenant_id, status);

-- Workflow steps
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps (tenant_id, workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_position ON workflow_steps (tenant_id, workflow_id, position);

-- Workflow instances
CREATE INDEX IF NOT EXISTS idx_workflow_instances_entity ON workflow_instances (tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_initiator ON workflow_instances (tenant_id, initiator_id);

-- Instance steps
CREATE INDEX IF NOT EXISTS idx_instance_steps_instance ON instance_steps (tenant_id, instance_id);
CREATE INDEX IF NOT EXISTS idx_instance_steps_assigned ON instance_steps (tenant_id, assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_instance_steps_due_date ON instance_steps (tenant_id, due_date) WHERE status = 'pending';

-- Notifications
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_recipient ON workflow_notifications (tenant_id, recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_sent ON workflow_notifications (tenant_id, sent_at);

-- Metrics
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_period ON workflow_metrics (tenant_id, period_start);
CREATE INDEX IF NOT EXISTS idx_step_metrics_period ON step_metrics (tenant_id, period_start);

-- =====================
-- TRIGGERS & FUNCTIONS
-- =====================

-- Updated_at trigger for all workflow tables
-- Explicit BEFORE UPDATE triggers using update_updated_at_column()
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON workflow_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_step_assignments_updated_at BEFORE UPDATE ON step_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escalation_rules_updated_at BEFORE UPDATE ON escalation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_instances_updated_at BEFORE UPDATE ON workflow_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_instance_steps_updated_at BEFORE UPDATE ON instance_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_step_delegations_updated_at BEFORE UPDATE ON step_delegations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_conditions_updated_at BEFORE UPDATE ON workflow_conditions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_condition_groups_updated_at BEFORE UPDATE ON condition_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_metrics_updated_at BEFORE UPDATE ON workflow_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_step_metrics_updated_at BEFORE UPDATE ON step_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_request_workflows_updated_at BEFORE UPDATE ON leave_request_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_workflows_updated_at BEFORE UPDATE ON expense_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recruitment_workflows_updated_at BEFORE UPDATE ON recruitment_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tenant validation trigger
CREATE OR REPLACE FUNCTION trg_validate_workflow_tenant() RETURNS trigger AS $$
DECLARE ref_tenant UUID;
BEGIN
    -- Validate workflow references
    IF NEW.workflow_id IS NOT NULL THEN
        ref_tenant := _get_tenant_id_for('workflows', NEW.workflow_id);
        IF ref_tenant IS NOT NULL AND ref_tenant != NEW.tenant_id THEN
            RAISE EXCEPTION 'Tenant mismatch in %: workflow_id % belongs to tenant %', TG_TABLE_NAME, NEW.workflow_id, ref_tenant;
        END IF;
    END IF;

    -- Validate step references
    IF NEW.step_id IS NOT NULL THEN
        ref_tenant := _get_tenant_id_for('workflow_steps', NEW.step_id);
        IF ref_tenant IS NOT NULL AND ref_tenant != NEW.tenant_id THEN
            RAISE EXCEPTION 'Tenant mismatch in %: step_id % belongs to tenant %', TG_TABLE_NAME, NEW.step_id, ref_tenant;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply tenant validation to workflow tables
DROP TRIGGER IF EXISTS trg_validate_workflow_tenant ON workflow_steps;
CREATE TRIGGER trg_validate_workflow_tenant BEFORE INSERT OR UPDATE ON workflow_steps FOR EACH ROW EXECUTE PROCEDURE trg_validate_workflow_tenant();

DROP TRIGGER IF EXISTS trg_validate_workflow_tenant ON workflow_instances;
CREATE TRIGGER trg_validate_workflow_tenant BEFORE INSERT OR UPDATE ON workflow_instances FOR EACH ROW EXECUTE PROCEDURE trg_validate_workflow_tenant();

DROP TRIGGER IF EXISTS trg_validate_workflow_tenant ON instance_steps;
CREATE TRIGGER trg_validate_workflow_tenant BEFORE INSERT OR UPDATE ON instance_steps FOR EACH ROW EXECUTE PROCEDURE trg_validate_workflow_tenant();

-- Auto-escalation function
CREATE OR REPLACE FUNCTION check_step_escalations() RETURNS void AS $$
BEGIN
    UPDATE instance_steps istep
    SET status = 'escalated',
        updated_at = now()
    FROM escalation_rules er
    WHERE istep.status = 'pending'
      AND istep.assigned_at IS NOT NULL
      AND now() > istep.assigned_at + (er.after_hours || ' hours')::interval
      AND istep.step_id = er.step_id
      AND istep.tenant_id = er.tenant_id;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- VIEWS FOR REPORTING
-- =====================

-- Workflow instance status view
CREATE OR REPLACE VIEW workflow_instance_status AS
SELECT 
    wi.tenant_id,
    wi.id AS instance_id,
    w.name AS workflow_name,
    wi.entity_type,
    wi.entity_id,
    wi.status,
    wi.initiator_id,
    u.email AS initiator_email,
    wi.current_step_id,
    ws.name AS current_step_name,
    wi.created_at,
    wi.completed_at,
    EXTRACT(EPOCH FROM (wi.completed_at - wi.created_at)) AS total_duration_seconds,
    (SELECT COUNT(*) FROM instance_steps WHERE instance_id = wi.id) AS total_steps,
    (SELECT COUNT(*) FROM instance_steps WHERE instance_id = wi.id AND status = 'completed') AS completed_steps
FROM workflow_instances wi
JOIN workflows w ON wi.workflow_id = w.id
JOIN users u ON wi.initiator_id = u.id
LEFT JOIN workflow_steps ws ON wi.current_step_id = ws.id
WHERE wi.deleted_at IS NULL;

-- User pending tasks view
CREATE OR REPLACE VIEW user_pending_tasks AS
SELECT 
    istep.tenant_id,
    istep.id AS step_id,
    istep.instance_id,
    wi.entity_type,
    wi.entity_id,
    wi.initiator_id,
    ws.name AS step_name,
    ws.step_type,
    ws.instructions,
    istep.assigned_to AS user_id,
    u.email AS user_email,
    istep.due_date,
    istep.assigned_at,
    EXTRACT(EPOCH FROM (now() - istep.assigned_at)) AS seconds_since_assignment,
    w.name AS workflow_name
FROM instance_steps istep
JOIN workflow_instances wi ON istep.instance_id = wi.id
JOIN workflow_steps ws ON istep.step_id = ws.id
JOIN workflows w ON wi.workflow_id = w.id
JOIN users u ON istep.assigned_to = u.id
WHERE istep.status = 'pending'
  AND istep.assigned_to IS NOT NULL
  AND wi.deleted_at IS NULL;

-- Workflow performance analytics view
CREATE OR REPLACE VIEW workflow_performance_analytics AS
SELECT 
    w.tenant_id,
    w.id AS workflow_id,
    w.name AS workflow_name,
    w.category,
    COUNT(wi.id) AS total_instances,
    COUNT(wi.id) FILTER (WHERE wi.status = 'completed') AS completed_instances,
    COUNT(wi.id) FILTER (WHERE wi.status = 'rejected') AS rejected_instances,
    AVG(EXTRACT(EPOCH FROM (wi.completed_at - wi.created_at))) FILTER (WHERE wi.status = 'completed') AS avg_completion_seconds,
    MAX(EXTRACT(EPOCH FROM (wi.completed_at - wi.created_at))) FILTER (WHERE wi.status = 'completed') AS max_completion_seconds,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (wi.completed_at - wi.created_at))) FILTER (WHERE wi.status = 'completed') AS p95_completion_seconds
FROM workflows w
LEFT JOIN workflow_instances wi ON w.id = wi.workflow_id AND wi.deleted_at IS NULL
WHERE w.deleted_at IS NULL
GROUP BY w.tenant_id, w.id, w.name, w.category;

-- =====================
-- SCHEDULED JOBS (Example)
-- =====================

-- Example: Scheduled job for escalation checks (would be set up in your job scheduler)
-- SELECT check_step_escalations(); -- Run every 15 minutes

-- =====================
-- SECURITY NOTES
-- =====================
-- In production, consider:
-- 1. Row Level Security (RLS) policies for workflow data
-- 2. Encryption for sensitive workflow data
-- 3. Audit logging for all workflow actions
-- 4. Rate limiting for workflow initiation
-- 5. Proper indexing for performance

-- End of Workflow Management schema

--