-- =====================
-- EMPLOYEE SELF-SERVICE (ESS) SCHEMA
-- Workforce Operations & Management | Portal for employees to manage personal info, request time-off, and access documents
-- Design principles:
--   - Multi-tenant (tenant_id) with tenant-consistency validation on cross-module references
--   - Explicit audit columns and updated_at triggers per table
--   - Integrations with: Core (employees), Leave (leave_requests), Document Management (documents), Workflows (optional)
--   - Approvals & audit for profile changes (industry compliance for PII): requests stored, reviewed, approved, applied
--   - Acknowledgements for policies/documents; document access logs
--   - Preferences and portal UX support (language, notifications)
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

-- Helper to fetch tenant_id for a given table/id (safe wrapper)
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
DO $$ BEGIN CREATE TYPE ess_request_status AS ENUM ('draft','submitted','under_review','approved','rejected','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE ess_ack_status AS ENUM ('required','acknowledged','waived'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE ess_owner_type AS ENUM ('profile_request','time_off_draft','acknowledgment'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE access_type AS ENUM ('view','download'); EXCEPTION WHEN duplicate_object THEN null; END; $$;

/*
====================================
ESS DOMAIN GROUPS
- Tenant & Preferences: ess_settings, ess_portal_preferences
- Profile Updates: ess_profile_requests, ess_profile_request_items
- Time-off Portal: ess_time_off_drafts, ess_time_off_portal (link to leave_requests)
- Documents & Policies: ess_required_acknowledgments, ess_acknowledgments, ess_document_access
- Attachments: ess_attachments (links to documents)
- Ops/Indexes/Triggers: performance indexes, tenant validation, updated_at triggers
====================================
*/

-- =====================
-- TENANT SETTINGS & PREFERENCES
-- =====================
/*
Table: ess_settings
Use: Tenant-level configuration toggles and UX settings for ESS.
*/
CREATE TABLE IF NOT EXISTS ess_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    features JSONB NOT NULL DEFAULT '{
        "allowProfileEdits": true,
        "requireApprovalForPII": true,
        "enableTimeOff": true,
        "enableDocuments": true,
        "showPaySummaries": true
    }',
    portal_branding JSONB DEFAULT '{
        "logoUrl": null,
        "primaryColor": "#0f62fe",
        "secondaryColor": "#393939"
    }',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/*
Table: ess_portal_preferences
Use: Per-employee ESS preferences (locale, notifications, theme).
Relationships: References employees.
*/
CREATE TABLE IF NOT EXISTS ess_portal_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    locale TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    notifications JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    theme JSONB DEFAULT '{"mode": "system"}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, employee_id)
);

-- =====================
-- PROFILE UPDATES (CHANGE REQUESTS)
-- =====================
/*
Table: ess_profile_requests
Use: Employee-submitted change requests for personal/PII data (address, contact, bank, tax, emergency contacts, etc.).
Process: Request is reviewed/approved; upon approval, changes are applied by application service and audited.
*/
CREATE TABLE IF NOT EXISTS ess_profile_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL, -- 'personal_info','address','contact','emergency_contact','bank','tax','other'
    requested_changes JSONB NOT NULL, -- Structured payload; application enforces shape per request_type
    status ess_request_status DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_comments TEXT,
    effective_date DATE,
    workflow_instance_id UUID, -- optional link to workflows.workflow_instances
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

/*
Table: ess_profile_request_items
Use: Optional granular items within a profile request (per-field change audit).
*/
CREATE TABLE IF NOT EXISTS ess_profile_request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES ess_profile_requests(id) ON DELETE CASCADE,
    field_path TEXT NOT NULL, -- e.g., 'address.street' or 'contacts[0].value'
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- TIME-OFF (ESS PORTAL)
-- =====================
/*
Table: ess_time_off_drafts
Use: Drafts saved by employee prior to submitting final leave_requests (from Leave module).
*/
CREATE TABLE IF NOT EXISTS ess_time_off_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    draft_data JSONB NOT NULL, -- {leave_type_id, start_date, end_date, half_day, reason, attachments: [document_id,...]}
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/*
Table: ess_time_off_portal
Use: ESS layer mapping a submitted time-off to the leave_requests record with portal metadata.
*/
CREATE TABLE IF NOT EXISTS ess_time_off_portal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    submitted_from TEXT DEFAULT 'web', -- 'web','mobile'
    attachments JSONB, -- redundant pointer if not using ess_attachments
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, leave_request_id)
);

-- =====================
-- DOCUMENTS & POLICIES
-- =====================
/*
Table: ess_required_acknowledgments
Use: Assigns policy documents (from Document Management) that require employee acknowledgment.
*/
CREATE TABLE IF NOT EXISTS ess_required_acknowledgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    target JSONB DEFAULT '{"allEmployees": true, "departments": [], "locations": []}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, document_id, effective_from)
);

/*
Table: ess_acknowledgments
Use: Employee acknowledgment tracking for required documents/policies.
*/
CREATE TABLE IF NOT EXISTS ess_acknowledgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    status ess_ack_status DEFAULT 'required',
    acked_at TIMESTAMPTZ,
    ack_version TEXT,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, employee_id, document_id)
);

/*
Table: ess_document_access
Use: Log of document views/downloads initiated via ESS for auditing.
*/
CREATE TABLE IF NOT EXISTS ess_document_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    access access_type NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- ATTACHMENTS (ESS)
-- =====================
/*
Table: ess_attachments
Use: Attach documents to ESS entities (profile requests, time-off drafts).
*/
CREATE TABLE IF NOT EXISTS ess_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_type ess_owner_type NOT NULL,
    owner_id UUID NOT NULL,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- INDEXES
-- =====================
-- Settings & preferences
CREATE INDEX IF NOT EXISTS idx_ess_settings_tenant ON ess_settings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ess_prefs_employee ON ess_portal_preferences (tenant_id, employee_id);

-- Profile requests
CREATE INDEX IF NOT EXISTS idx_ess_profile_requests_status ON ess_profile_requests (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ess_profile_requests_emp ON ess_profile_requests (tenant_id, employee_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_ess_profile_items_req ON ess_profile_request_items (tenant_id, request_id);

-- Time-off
CREATE INDEX IF NOT EXISTS idx_ess_timeoff_drafts_emp ON ess_time_off_drafts (tenant_id, employee_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ess_timeoff_portal_lr ON ess_time_off_portal (tenant_id, leave_request_id);

-- Documents
CREATE INDEX IF NOT EXISTS idx_ess_required_ack ON ess_required_acknowledgments (tenant_id, document_id, effective_from);
CREATE INDEX IF NOT EXISTS idx_ess_acks_emp ON ess_acknowledgments (tenant_id, employee_id, status);
CREATE INDEX IF NOT EXISTS idx_ess_doc_access_emp ON ess_document_access (tenant_id, employee_id, accessed_at DESC);

-- Attachments
CREATE INDEX IF NOT EXISTS idx_ess_attachments_owner ON ess_attachments (tenant_id, owner_type, owner_id);

-- =====================
-- TRIGGERS & VALIDATION
-- =====================
-- updated_at triggers
CREATE TRIGGER update_ess_settings_updated_at BEFORE UPDATE ON ess_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ess_prefs_updated_at BEFORE UPDATE ON ess_portal_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ess_profile_requests_updated_at BEFORE UPDATE ON ess_profile_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ess_profile_request_items_updated_at BEFORE UPDATE ON ess_profile_request_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ess_timeoff_drafts_updated_at BEFORE UPDATE ON ess_time_off_drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ess_timeoff_portal_updated_at BEFORE UPDATE ON ess_time_off_portal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ess_required_ack_updated_at BEFORE UPDATE ON ess_required_acknowledgments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ess_acks_updated_at BEFORE UPDATE ON ess_acknowledgments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ess_doc_access_updated_at BEFORE UPDATE ON ess_document_access FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ess_attachments_updated_at BEFORE UPDATE ON ess_attachments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tenant validation: ensure employee/document/leave_request references match tenant
CREATE OR REPLACE FUNCTION trg_validate_ess_employee_tenant() RETURNS trigger AS $$
DECLARE e_t UUID; BEGIN
    e_t := _get_tenant_id_for('employees', NEW.employee_id);
    IF e_t IS NULL OR e_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch: employee vs ESS record'; END IF;
    RETURN NEW; END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ess_prefs_tenant ON ess_portal_preferences;
CREATE TRIGGER trg_ess_prefs_tenant BEFORE INSERT OR UPDATE ON ess_portal_preferences FOR EACH ROW EXECUTE PROCEDURE trg_validate_ess_employee_tenant();

DROP TRIGGER IF EXISTS trg_ess_profile_requests_tenant ON ess_profile_requests;
CREATE TRIGGER trg_ess_profile_requests_tenant BEFORE INSERT OR UPDATE ON ess_profile_requests FOR EACH ROW EXECUTE PROCEDURE trg_validate_ess_employee_tenant();

DROP TRIGGER IF EXISTS trg_ess_timeoff_drafts_tenant ON ess_time_off_drafts;
CREATE TRIGGER trg_ess_timeoff_drafts_tenant BEFORE INSERT OR UPDATE ON ess_time_off_drafts FOR EACH ROW EXECUTE PROCEDURE trg_validate_ess_employee_tenant();

DROP TRIGGER IF EXISTS trg_ess_timeoff_portal_tenant ON ess_time_off_portal;
CREATE TRIGGER trg_ess_timeoff_portal_tenant BEFORE INSERT OR UPDATE ON ess_time_off_portal FOR EACH ROW EXECUTE PROCEDURE trg_validate_ess_employee_tenant();

CREATE OR REPLACE FUNCTION trg_validate_ess_doc_tenant() RETURNS trigger AS $$
DECLARE d_t UUID; BEGIN
    d_t := _get_tenant_id_for('documents', NEW.document_id);
    IF d_t IS NULL OR d_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch: document vs ESS record'; END IF;
    RETURN NEW; END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ess_required_ack_doc_tenant ON ess_required_acknowledgments;
CREATE TRIGGER trg_ess_required_ack_doc_tenant BEFORE INSERT OR UPDATE ON ess_required_acknowledgments FOR EACH ROW EXECUTE PROCEDURE trg_validate_ess_doc_tenant();

DROP TRIGGER IF EXISTS trg_ess_acks_doc_tenant ON ess_acknowledgments;
CREATE TRIGGER trg_ess_acks_doc_tenant BEFORE INSERT OR UPDATE ON ess_acknowledgments FOR EACH ROW EXECUTE PROCEDURE trg_validate_ess_doc_tenant();

DROP TRIGGER IF EXISTS trg_ess_doc_access_doc_tenant ON ess_document_access;
CREATE TRIGGER trg_ess_doc_access_doc_tenant BEFORE INSERT OR UPDATE ON ess_document_access FOR EACH ROW EXECUTE PROCEDURE trg_validate_ess_doc_tenant();

DROP TRIGGER IF EXISTS trg_ess_attachments_doc_tenant ON ess_attachments;
CREATE TRIGGER trg_ess_attachments_doc_tenant BEFORE INSERT OR UPDATE ON ess_attachments FOR EACH ROW EXECUTE PROCEDURE trg_validate_ess_doc_tenant();

-- Validate leave_request in portal mapping
CREATE OR REPLACE FUNCTION trg_validate_ess_leave_tenant() RETURNS trigger AS $$
DECLARE lr_t UUID; BEGIN
    lr_t := _get_tenant_id_for('leave_requests', NEW.leave_request_id);
    IF lr_t IS NULL OR lr_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch: leave_request vs ESS portal record'; END IF;
    RETURN NEW; END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ess_timeoff_portal_leave_tenant ON ess_time_off_portal;
CREATE TRIGGER trg_ess_timeoff_portal_leave_tenant BEFORE INSERT OR UPDATE ON ess_time_off_portal FOR EACH ROW EXECUTE PROCEDURE trg_validate_ess_leave_tenant();

-- =====================
-- VIEWS (PORTAL)
-- =====================
/*
View: ess_employee_dashboard
Use: Snapshot for an employee portal: pending profile requests, upcoming leave, required acks, recent docs.
*/
CREATE OR REPLACE VIEW ess_employee_dashboard AS
SELECT e.tenant_id,
       e.id AS employee_id,
       (SELECT COUNT(*) FROM ess_profile_requests r WHERE r.employee_id = e.id AND r.status IN ('submitted','under_review')) AS pending_profile_requests,
       (SELECT COUNT(*) FROM leave_requests lr WHERE lr.employee_id = e.id AND lr.status IN ('pending','in_review')) AS pending_leave_requests,
       (SELECT COUNT(*) FROM ess_acknowledgments ack WHERE ack.employee_id = e.id AND ack.status = 'required') AS required_ack_count,
       (SELECT jsonb_agg(jsonb_build_object('document_id', da.document_id, 'accessed_at', da.accessed_at) ORDER BY da.accessed_at DESC)
        FROM ess_document_access da WHERE da.employee_id = e.id LIMIT 5) AS recent_docs
FROM employees e
WHERE e.deleted_at IS NULL;

-- ====================================
-- ROW-LEVEL SECURITY (RLS)
-- ====================================
ALTER TABLE ess_settings                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ess_portal_preferences        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ess_profile_requests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ess_profile_request_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ess_time_off_drafts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ess_time_off_portal           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ess_required_acknowledgments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ess_acknowledgments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ess_document_access           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ess_attachments               ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON ess_settings                 USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON ess_portal_preferences       USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON ess_profile_requests         USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON ess_profile_request_items    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON ess_time_off_drafts          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON ess_time_off_portal          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON ess_required_acknowledgments USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON ess_acknowledgments          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON ess_document_access          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON ess_attachments              USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

