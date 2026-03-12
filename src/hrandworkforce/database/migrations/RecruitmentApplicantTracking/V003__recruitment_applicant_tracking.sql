-- Multi-tenant HR & Workforce Management System
-- Recruitment + Applicant Tracking SQL schema (PostgreSQL)
-- Scope: Recruitment & Applicant Tracking Entities only
-- Entities included:
--   job_requisitions, job_postings, applications, applicants, applicant_contacts,
--   applicant_documents, pipelines, pipeline_stages, interviews, interviewers,
--   offers, notes, tags, tagged_items, evaluations
-- Design goals:
--  - Single shared-database multi-tenant model (tenant_id UUID on tenant-scoped tables)
--  - Strong tenant isolation checks via FK + trigger-based tenant-consistency validation
--  - Soft deletes (deleted_at), optimistic locking (version), and audit fields
--  - Enumerated types for common statuses for clarity and integrity
--  - Full-text search support and useful indexes for production use
--  - Clear one-to-many and many-to-many relationships; cascades chosen conservatively

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Additional extensions
CREATE EXTENSION IF NOT EXISTS citext;

-- Utility function: sets updated_at on row updates (uniform pattern)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================
-- ENUMS / TYPE DEFINITIONS
-- =====================
DO $$ BEGIN CREATE TYPE job_status AS ENUM ('open','on_hold','closed','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE application_status AS ENUM ('applied','screening','phone_screen','assessment','interviewing','offer','hired','rejected','withdrawn'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE interview_status AS ENUM ('scheduled','rescheduled','completed','cancelled','no_show'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE offer_status AS ENUM ('pending','approved','issued','accepted','declined','withdrawn'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
-- Renamed from contact_type to avoid collision with core_configuration's contact_type enum
DO $$ BEGIN CREATE TYPE applicant_contact_type AS ENUM ('email','phone','mobile','linkedin','twitter','other'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE document_type AS ENUM ('resume','cover_letter','portfolio','transcript','certificate','id_proof','visa','work_permit','reference_letter','performance_review','contract','offer_letter','background_check','driving_license','passport','degree','diploma','other'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE note_visibility AS ENUM ('private','team','public'); EXCEPTION WHEN duplicate_object THEN null; END; $$;


-- =====================
-- NOTES: Referential & cascade choices (production-ready recommendations)
--  - tenant_id is required on tenant-scoped tables and references an external tenants(id)
--  - users table is expected to exist in the auth module; many columns reference users(id)
--  - Cascades are conservative: deletion of tenants cascades to tenant-scoped data; deletion of core records
--    (like job_postings) is handled via ON DELETE CASCADE where removing the parent should remove children
--    (.g., remove a posting -> remove its applications) or ON DELETE SET NULL where preserving history is important.
--  - Adjust ON DELETE behavior to match your product rules (auditing vs hard-delete).

-- =====================
-- JOB REQUISITIONS (a hiring need / req)
-- =====================
CREATE TABLE IF NOT EXISTS job_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    reference_code TEXT, -- e.g. REQ-2025-001 (unique per tenant)
    title TEXT NOT NULL,
    department TEXT,
    location TEXT,
    employment_type TEXT, -- e.g., Full-time, Part-time, Contract
    hiring_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recruiter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    headcount INT DEFAULT 1,
    status job_status DEFAULT 'open',
    compensation_range JSONB,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version INT DEFAULT 1,
    UNIQUE (tenant_id, reference_code)
);

-- Relationship: one job_requisition can have many job_postings (1:N)

-- =====================
-- JOB POSTINGS (specific published posting - may be linked to external boards)
-- =====================
/*
Table: job_postings
Use: Public-facing job posting derived from a requisition; supports publishing windows and FTS.
Relationships: applications link to postings; requisition optional.
Implementation: search_vector tsvector; metadata JSONB; soft-delete aware uniqueness on slug.
*/
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    requisition_id UUID REFERENCES job_requisitions(id) ON DELETE SET NULL,
    external_id TEXT, -- identifier on external job board
    title TEXT NOT NULL,
    slug TEXT,
    summary TEXT,
    full_description TEXT,
    location TEXT,
    is_remote BOOLEAN DEFAULT false,
    employment_type TEXT,
    compensation_range JSONB,
    is_published BOOLEAN DEFAULT false,
    publish_at TIMESTAMPTZ,
    expire_at TIMESTAMPTZ,
    apply_url TEXT, -- if external
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version INT DEFAULT 1,
    UNIQUE (tenant_id, requisition_id, slug)
);

-- Full-text search column
ALTER TABLE IF EXISTS job_postings
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Relationship: one job_posting can have many applications (1:N)
-- Applications reference job_postings.job_posting_id with ON DELETE CASCADE in this schema (see applications table)

-- =====================
-- APPLICANTS (candidate profile/contact record)
-- =====================
/*
Table: applicants
Use: Candidate master record with parsed profile and resume text for search.
Relationships: applications, documents, contacts link to applicant.
Implementation: CITEXT email (unique per tenant); resume_search tsvector for FTS.
*/
CREATE TABLE IF NOT EXISTS applicants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    preferred_name TEXT,
    email CITEXT,
    phone TEXT,
    current_title TEXT,
    current_company TEXT,
    location TEXT,
    headline TEXT,
    resume_text TEXT, -- extracted plain text
    profile JSONB DEFAULT '{}'::jsonb, -- parsed CV fields
    source TEXT, -- e.g., LinkedIn, referral, job_board
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version INT DEFAULT 1,
    UNIQUE (tenant_id, email)
);

-- Full-text search column for applicants
ALTER TABLE IF EXISTS applicants
    ADD COLUMN IF NOT EXISTS resume_search tsvector;

-- Relationship: one applicant can have many applications, documents, contacts (1:N)

-- =====================
-- APPLICANT CONTACTS
-- =====================
/*
Table: applicant_contacts
Use: Additional contact points for an applicant (email, phone, socials).
Relationships: FK to applicants; tenant enforcement via trigger.
*/
CREATE TABLE IF NOT EXISTS applicant_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    type applicant_contact_type NOT NULL,
    value TEXT NOT NULL,
    is_preferred BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- APPLICANT DOCUMENTS
-- =====================
/*
Table: applicant_documents
Use: Stores uploaded candidate docs (resume, cover, IDs) and extracted text.
Relationships: FK to applicants; tenant enforcement via trigger.
Implementation: JSONB metadata; optional checksum; extracted_text for analytics/search.
*/
CREATE TABLE IF NOT EXISTS applicant_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    document_type document_type DEFAULT 'resume',
    filename TEXT,
    content_type TEXT,
    content_size BIGINT,
    storage_key TEXT NOT NULL, -- e.g., s3 key
    file_hash TEXT, -- optional checksum (sha256)
    extracted_text TEXT, -- extracted for search
    metadata JSONB DEFAULT '{}'::jsonb,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- PIPELINES & STAGES
-- =====================
/*
Table: pipelines
Use: Defines recruitment pipelines per tenant (named workflow of stages).
Relationships: pipeline_stages; applications may refer to pipeline.
*/
CREATE TABLE IF NOT EXISTS pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);

/*
Table: pipeline_stages
Use: Ordered stages within a pipeline controlling candidate progression.
Relationships: applications.stage_id; FK to pipelines; tenant validation enforced.
*/
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    requires_assessment BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pipeline_id, name)
);

-- =====================
-- APPLICATIONS
-- =====================
/*
Table: applications
Use: Candidate application into a posting/pipeline; tracks status and metadata.
Relationships: applicants, job_postings, requisitions, pipelines, stages.
Implementation: Soft-delete-aware unique index per applicant+posting; tenant validation triggers.
*/
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    requisition_id UUID REFERENCES job_requisitions(id) ON DELETE SET NULL,
    pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
    stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    source TEXT,
    status application_status DEFAULT 'applied',
    apply_reference TEXT, -- third-party apply id
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    version INT DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Only one active application per applicant -> job_posting (soft-delete-aware)
CREATE UNIQUE INDEX IF NOT EXISTS ux_applicant_job_active ON applications (tenant_id, applicant_id, job_posting_id)
    WHERE (deleted_at IS NULL);

-- Relationship: one application can have many interviews, evaluations, offers, notes (1:N)

-- =====================
-- INTERVIEWS
-- =====================
/*
Table: interviews
Use: Schedules candidate interviews with agenda, status and timeslot.
Relationships: applications (parent), interviewers (panel link table).
Implementation: status tracking; metadata JSONB.
*/
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    scheduled_by UUID REFERENCES users(id),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    timezone TEXT,
    location TEXT,
    mode TEXT, -- onsite, phone, video
    agenda TEXT,
    status interview_status DEFAULT 'scheduled',
    cancelled_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- INTERVIEWERS (many-to-many between interviews and users)
/*
Table: interviewers
Use: Junction table: interview <-> user interviewers with roles and feedback.
Relationships: interviews; users.
Implementation: Composite PK (interview_id, user_id); attendance and scoring fields.
*/
CREATE TABLE IF NOT EXISTS interviewers (
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT, -- e.g., panelist, hiring_manager
    is_primary BOOLEAN DEFAULT false,
    attended BOOLEAN DEFAULT false,
    feedback JSONB,
    score NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (interview_id, user_id)
);

-- =====================
-- OFFERS
-- =====================
/*
Table: offers
Use: Job offers issued to candidates including compensation and timestamps.
Relationships: applications; users (issuer, hiring manager).
Implementation: status enum; metadata JSONB; integrity checks enforced elsewhere.
*/
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    offered_by UUID REFERENCES users(id),
    hiring_manager_id UUID REFERENCES users(id),
    compensation JSONB, -- {base, currency, bonus, equity}
    benefits JSONB,
    status offer_status DEFAULT 'pending',
    issued_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================
-- NOTES (polymorphic parent: applicants, applications, requisitions, interviews, offers, job_postings)
-- =====================
/*
Table: notes
Use: Polymorphic notes across entities (applicants, applications, interviews, offers, postings).
Relationships: parent_type/parent_id gated by tenant validation trigger.
Implementation: Visibility control (private/team/public).
*/
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_type TEXT NOT NULL,
    parent_id UUID NOT NULL,
    created_by UUID REFERENCES users(id),
    visibility note_visibility DEFAULT 'private',
    body TEXT,
    attachments JSONB, -- list of document ids or storage keys
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- TAGS & TAGGED ITEMS (polymorphic tagging)
-- =====================
/*
Table: tags
Use: Tenant-scoped tags to classify items (applicants, applications, postings, etc.).
Relationships: tagged_items for polymorphic assignment.
*/
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tags_tenant_name ON tags (tenant_id, lower(name));

/*
Table: tagged_items
Use: Polymorphic tagging link table mapping tags to items by type/id.
Relationships: tags; item resolved by tenant validation trigger.
*/
CREATE TABLE IF NOT EXISTS tagged_items (
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- applicants, applications, job_postings, etc.
    item_id UUID NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tag_id, item_type, item_id)
);

-- =====================
-- EVALUATIONS (candidate/applicant/application/interview evaluations)
-- =====================
/*
Table: evaluations
Use: Evaluation records (applicant/application/interview) with criteria and aggregate scoring.
Relationships: users (evaluator), applications/applicants/interviews.
*/
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    applicant_id UUID REFERENCES applicants(id) ON DELETE SET NULL,
    interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
    evaluator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    score NUMERIC(6,2), -- aggregated score
    criteria JSONB, -- e.g., [{"name":"technical","weight":0.6,"score":4},{...}]
    passed BOOLEAN,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- AUDIT / ACTIVITY LOG (lightweight)
-- =====================
/*
Table: rat_activity_logs
Use: Lightweight activity log for RAT module (who/what/when).
Implementation: JSONB data blob; tenant scoped.
*/
CREATE TABLE IF NOT EXISTS rat_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- INDEXES & FULL-TEXT
-- Comprehensive indexes for production workloads and full-text search support
-- Note: tenants and users tables are assumed to exist elsewhere in the system; triggers use tenant_id lookups.

-- Standard B-tree indexes for common lookup patterns

CREATE INDEX IF NOT EXISTS idx_job_postings_publish ON job_postings (tenant_id, is_published, publish_at);
CREATE INDEX IF NOT EXISTS idx_job_postings_requisition ON job_postings (tenant_id, requisition_id);
CREATE INDEX IF NOT EXISTS idx_job_requisitions_tenant_ref ON job_requisitions (tenant_id, reference_code);
CREATE INDEX IF NOT EXISTS idx_applicants_tenant_name ON applicants (tenant_id, lower(last_name), lower(first_name));
CREATE INDEX IF NOT EXISTS idx_applicants_email ON applicants (tenant_id, lower(email));
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications (tenant_id, job_posting_id);
CREATE INDEX IF NOT EXISTS idx_interviews_start ON interviews (tenant_id, start_at);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tags_tenant_name ON tags (tenant_id, lower(name));

-- GIN indexes for JSONB fields to support filtering & analytics
CREATE INDEX IF NOT EXISTS idx_job_postings_metadata_gin ON job_postings USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_applicants_profile_gin ON applicants USING GIN (profile);
CREATE INDEX IF NOT EXISTS idx_applicant_doc_metadata ON applicant_documents USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_applications_metadata_gin ON applications USING GIN (metadata);

-- UNIQUE / Partial Indexes (deduplicated)
-- Note: ux_applicant_job_active is already defined earlier; duplicate removed for uniformity.

-- FULL-TEXT SEARCH: tsvector columns and triggers
-- job_postings.search_vector and applicants.resume_search are defined earlier; create triggers to update them on change.

CREATE INDEX IF NOT EXISTS idx_job_postings_search_vector ON job_postings USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_applicants_resume_search ON applicants USING GIN (resume_search);

-- Function to update search_vector for job_postings
CREATE OR REPLACE FUNCTION trg_update_job_postings_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', coalesce(NEW.title,'') || ' ' || coalesce(NEW.summary,'') || ' ' || coalesce(NEW.full_description,''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_postings_search_vector ON job_postings;
CREATE TRIGGER trg_job_postings_search_vector BEFORE INSERT OR UPDATE ON job_postings
FOR EACH ROW EXECUTE PROCEDURE trg_update_job_postings_search_vector();

-- Function to update resume_search for applicants
CREATE OR REPLACE FUNCTION trg_update_applicants_resume_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.resume_search := to_tsvector('english', coalesce(NEW.resume_text,'') || ' ' || coalesce(NEW.first_name,'') || ' ' || coalesce(NEW.last_name,''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_applicants_resume_search ON applicants;
CREATE TRIGGER trg_applicants_resume_search BEFORE INSERT OR UPDATE ON applicants
FOR EACH ROW EXECUTE PROCEDURE trg_update_applicants_resume_search_vector();

-- =====================
-- TRIGGERS & FUNCTIONS (general)
--  - updated_at/version trigger
--  - tenant consistency validation per table (checks referenced rows belong to same tenant)
--  - helpers for soft-delete and audit
-- =====================

-- updated_at + optimistic versioning generic trigger
CREATE OR REPLACE FUNCTION set_updated_at_column() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at = now();
        IF TG_WHEN = 'BEFORE' THEN
            NEW.version = COALESCE(NEW.version, 1) + 1;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach generic trigger to tables that have updated_at & version
-- Explicit BEFORE UPDATE triggers using update_updated_at_column() for tables with updated_at
CREATE TRIGGER update_job_requisitions_updated_at BEFORE UPDATE ON job_requisitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applicants_updated_at BEFORE UPDATE ON applicants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Tenant validation triggers (validate referenced rows' tenant_id matches NEW.tenant_id)

-- Validate job_postings: if requisition_id present, ensure tenants match
CREATE OR REPLACE FUNCTION trg_validate_job_posting_tenant() RETURNS trigger AS $$
DECLARE parent_tenant UUID;
BEGIN
    IF NEW.requisition_id IS NOT NULL THEN
        parent_tenant := _get_tenant_id_for('job_requisitions', NEW.requisition_id);
        IF parent_tenant IS NULL THEN
            RAISE EXCEPTION 'job_requisitions record not found: %', NEW.requisition_id;
        END IF;
        IF parent_tenant != NEW.tenant_id THEN
            RAISE EXCEPTION 'tenant mismatch between job_postings (tenant=%) and job_requisitions (tenant=%)', NEW.tenant_id, parent_tenant;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_posting_tenant ON job_postings;
CREATE TRIGGER trg_job_posting_tenant BEFORE INSERT OR UPDATE ON job_postings FOR EACH ROW EXECUTE PROCEDURE trg_validate_job_posting_tenant();

-- Validate pipeline stage tenant matches pipeline tenant
CREATE OR REPLACE FUNCTION trg_validate_pipeline_stage_tenant() RETURNS trigger AS $$
DECLARE p_tenant UUID;
BEGIN
    p_tenant := _get_tenant_id_for('pipelines', NEW.pipeline_id);
    IF p_tenant IS NULL THEN
        RAISE EXCEPTION 'pipeline not found: %', NEW.pipeline_id;
    END IF;
    IF p_tenant != NEW.tenant_id THEN
        RAISE EXCEPTION 'tenant mismatch between pipeline_stages (tenant=%) and pipelines (tenant=%)', NEW.tenant_id, p_tenant;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pipeline_stage_tenant ON pipeline_stages;
CREATE TRIGGER trg_pipeline_stage_tenant BEFORE INSERT OR UPDATE ON pipeline_stages FOR EACH ROW EXECUTE PROCEDURE trg_validate_pipeline_stage_tenant();

-- Validate applications: applicant, job_posting, requisition, pipeline must belong to same tenant
CREATE OR REPLACE FUNCTION trg_validate_application_tenant() RETURNS trigger AS $$
DECLARE a_tenant UUID; jp_tenant UUID; rq_tenant UUID; pl_tenant UUID; stg_tenant UUID;
BEGIN
    -- applicant
    a_tenant := _get_tenant_id_for('applicants', NEW.applicant_id);
    IF a_tenant IS NULL THEN
        RAISE EXCEPTION 'applicant not found: %', NEW.applicant_id;
    END IF;
    IF a_tenant != NEW.tenant_id THEN
        RAISE EXCEPTION 'tenant mismatch between application and applicant';
    END IF;

    -- job_posting (if provided)
    IF NEW.job_posting_id IS NOT NULL THEN
        jp_tenant := _get_tenant_id_for('job_postings', NEW.job_posting_id);
        IF jp_tenant IS NULL THEN RAISE EXCEPTION 'job_posting not found: %', NEW.job_posting_id; END IF;
        IF jp_tenant != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between application and job_posting'; END IF;
    END IF;

    -- requisition (if provided)
    IF NEW.requisition_id IS NOT NULL THEN
        rq_tenant := _get_tenant_id_for('job_requisitions', NEW.requisition_id);
        IF rq_tenant IS NULL THEN RAISE EXCEPTION 'requisition not found: %', NEW.requisition_id; END IF;
        IF rq_tenant != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between application and requisition'; END IF;
    END IF;

    -- pipeline (if provided)
    IF NEW.pipeline_id IS NOT NULL THEN
        pl_tenant := _get_tenant_id_for('pipelines', NEW.pipeline_id);
        IF pl_tenant IS NULL THEN RAISE EXCEPTION 'pipeline not found: %', NEW.pipeline_id; END IF;
        IF pl_tenant != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between application and pipeline'; END IF;
    END IF;

    -- stage (if provided)
    IF NEW.stage_id IS NOT NULL THEN
        stg_tenant := _get_tenant_id_for('pipeline_stages', NEW.stage_id);
        IF stg_tenant IS NULL THEN RAISE EXCEPTION 'pipeline_stage not found: %', NEW.stage_id; END IF;
        IF stg_tenant != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between application and pipeline_stage'; END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_application_tenant ON applications;
CREATE TRIGGER trg_application_tenant BEFORE INSERT OR UPDATE ON applications FOR EACH ROW EXECUTE PROCEDURE trg_validate_application_tenant();

-- Validate applicant_contacts & applicant_documents tenant against applicant
CREATE OR REPLACE FUNCTION trg_validate_applicant_related_tenant() RETURNS trigger AS $$
DECLARE a_t UUID;
BEGIN
    a_t := _get_tenant_id_for('applicants', NEW.applicant_id);
    IF a_t IS NULL THEN RAISE EXCEPTION 'applicant not found: %', NEW.applicant_id; END IF;
    IF a_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between applicant-related record and applicant'; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_applicant_contact_tenant ON applicant_contacts;
CREATE TRIGGER trg_applicant_contact_tenant BEFORE INSERT OR UPDATE ON applicant_contacts FOR EACH ROW EXECUTE PROCEDURE trg_validate_applicant_related_tenant();

DROP TRIGGER IF EXISTS trg_applicant_document_tenant ON applicant_documents;
CREATE TRIGGER trg_applicant_document_tenant BEFORE INSERT OR UPDATE ON applicant_documents FOR EACH ROW EXECUTE PROCEDURE trg_validate_applicant_related_tenant();

-- Validate interviews: application must belong to tenant
CREATE OR REPLACE FUNCTION trg_validate_interview_tenant() RETURNS trigger AS $$
DECLARE app_t UUID;
BEGIN
    app_t := _get_tenant_id_for('applications', NEW.application_id);
    IF app_t IS NULL THEN RAISE EXCEPTION 'application not found: %', NEW.application_id; END IF;
    IF app_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between interview and application'; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_interview_tenant ON interviews;
CREATE TRIGGER trg_interview_tenant BEFORE INSERT OR UPDATE ON interviews FOR EACH ROW EXECUTE PROCEDURE trg_validate_interview_tenant();

-- Validate interviewers: ensure interview belongs to same tenant
CREATE OR REPLACE FUNCTION trg_validate_interviewer_tenant() RETURNS trigger AS $$
DECLARE intv_t UUID;
BEGIN
    intv_t := _get_tenant_id_for('interviews', NEW.interview_id);
    IF intv_t IS NULL THEN RAISE EXCEPTION 'interview not found: %', NEW.interview_id; END IF;
    IF intv_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between interviewer entry and interview'; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_interviewer_tenant ON interviewers;
CREATE TRIGGER trg_interviewer_tenant BEFORE INSERT OR UPDATE ON interviewers FOR EACH ROW EXECUTE PROCEDURE trg_validate_interviewer_tenant();

-- Validate offers: application must belong to tenant
CREATE OR REPLACE FUNCTION trg_validate_offer_tenant() RETURNS trigger AS $$
DECLARE app_t UUID;
BEGIN
    app_t := _get_tenant_id_for('applications', NEW.application_id);
    IF app_t IS NULL THEN RAISE EXCEPTION 'application not found: %', NEW.application_id; END IF;
    IF app_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between offer and application'; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_offer_tenant ON offers;
CREATE TRIGGER trg_offer_tenant BEFORE INSERT OR UPDATE ON offers FOR EACH ROW EXECUTE PROCEDURE trg_validate_offer_tenant();

-- Validate notes parent belongs to same tenant (polymorphic parent types)
CREATE OR REPLACE FUNCTION trg_validate_notes_tenant() RETURNS trigger AS $$
DECLARE parent_t UUID;
BEGIN
    CASE NEW.parent_type
        WHEN 'applicants' THEN parent_t := _get_tenant_id_for('applicants', NEW.parent_id);
        WHEN 'applications' THEN parent_t := _get_tenant_id_for('applications', NEW.parent_id);
        WHEN 'requisitions' THEN parent_t := _get_tenant_id_for('job_requisitions', NEW.parent_id);
        WHEN 'job_postings' THEN parent_t := _get_tenant_id_for('job_postings', NEW.parent_id);
        WHEN 'interviews' THEN parent_t := _get_tenant_id_for('interviews', NEW.parent_id);
        WHEN 'offers' THEN parent_t := _get_tenant_id_for('offers', NEW.parent_id);
        ELSE
            RAISE EXCEPTION 'unsupported parent_type for notes: %', NEW.parent_type;
    END CASE;

    IF parent_t IS NULL THEN RAISE EXCEPTION 'parent not found: %/%', NEW.parent_type, NEW.parent_id; END IF;
    IF parent_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between note and parent'; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notes_tenant ON notes;
CREATE TRIGGER trg_notes_tenant BEFORE INSERT OR UPDATE ON notes FOR EACH ROW EXECUTE PROCEDURE trg_validate_notes_tenant();

-- Validate tagged_items tenant against tag and target item
CREATE OR REPLACE FUNCTION trg_validate_tagged_item_tenant() RETURNS trigger AS $$
DECLARE t_t UUID; item_t UUID;
BEGIN
    -- tag must belong to same tenant
    SELECT tenant_id INTO t_t FROM tags WHERE id = NEW.tag_id;
    IF t_t IS NULL THEN RAISE EXCEPTION 'tag not found: %', NEW.tag_id; END IF;
    IF t_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between tagged_items and tag'; END IF;

    -- resolve item tenant based on item_type
    CASE NEW.item_type
        WHEN 'applicants' THEN item_t := _get_tenant_id_for('applicants', NEW.item_id);
        WHEN 'applications' THEN item_t := _get_tenant_id_for('applications', NEW.item_id);
        WHEN 'job_postings' THEN item_t := _get_tenant_id_for('job_postings', NEW.item_id);
        WHEN 'job_requisitions' THEN item_t := _get_tenant_id_for('job_requisitions', NEW.item_id);
        ELSE
            RAISE EXCEPTION 'unsupported item_type for tagging: %', NEW.item_type;
    END CASE;

    IF item_t IS NULL THEN RAISE EXCEPTION 'tagged item not found: %/%', NEW.item_type, NEW.item_id; END IF;
    IF item_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between tagged_items and tagged item'; END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tagged_item_tenant ON tagged_items;
CREATE TRIGGER trg_tagged_item_tenant BEFORE INSERT OR UPDATE ON tagged_items FOR EACH ROW EXECUTE PROCEDURE trg_validate_tagged_item_tenant();

-- Validate evaluations: if linked to application/interview/applicant ensure tenant matches
CREATE OR REPLACE FUNCTION trg_validate_evaluation_tenant() RETURNS trigger AS $$
DECLARE a_t UUID; app_t UUID; intv_t UUID;
BEGIN
    IF NEW.application_id IS NOT NULL THEN
        app_t := _get_tenant_id_for('applications', NEW.application_id);
        IF app_t IS NULL THEN RAISE EXCEPTION 'application not found: %', NEW.application_id; END IF;
        IF app_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between evaluation and application'; END IF;
    END IF;

    IF NEW.applicant_id IS NOT NULL THEN
        a_t := _get_tenant_id_for('applicants', NEW.applicant_id);
        IF a_t IS NULL THEN RAISE EXCEPTION 'applicant not found: %', NEW.applicant_id; END IF;
        IF a_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between evaluation and applicant'; END IF;
    END IF;

    IF NEW.interview_id IS NOT NULL THEN
        intv_t := _get_tenant_id_for('interviews', NEW.interview_id);
        IF intv_t IS NULL THEN RAISE EXCEPTION 'interview not found: %', NEW.interview_id; END IF;
        IF intv_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between evaluation and interview'; END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_evaluation_tenant ON evaluations;
CREATE TRIGGER trg_evaluation_tenant BEFORE INSERT OR UPDATE ON evaluations FOR EACH ROW EXECUTE PROCEDURE trg_validate_evaluation_tenant();

-- =====================
-- RE-ATTACH PROTECTIVE TRIGGERS (idempotent)
-- =====================
DO $$
BEGIN
    -- job_postings tenant validation
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_validate_job_posting_tenant') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trg_job_posting_tenant ON job_postings';
        EXECUTE 'CREATE TRIGGER trg_job_posting_tenant BEFORE INSERT OR UPDATE ON job_postings FOR EACH ROW EXECUTE PROCEDURE trg_validate_job_posting_tenant()';
    END IF;

    -- pipeline_stages tenant validation
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_validate_pipeline_stage_tenant') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trg_pipeline_stage_tenant ON pipeline_stages';
        EXECUTE 'CREATE TRIGGER trg_pipeline_stage_tenant BEFORE INSERT OR UPDATE ON pipeline_stages FOR EACH ROW EXECUTE PROCEDURE trg_validate_pipeline_stage_tenant()';
    END IF;

    -- applications tenant validation
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_validate_application_tenant') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trg_application_tenant ON applications';
        EXECUTE 'CREATE TRIGGER trg_application_tenant BEFORE INSERT OR UPDATE ON applications FOR EACH ROW EXECUTE PROCEDURE trg_validate_application_tenant()';
    END IF;

    -- applicant related validation
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_validate_applicant_related_tenant') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trg_applicant_contact_tenant ON applicant_contacts';
        EXECUTE 'CREATE TRIGGER trg_applicant_contact_tenant BEFORE INSERT OR UPDATE ON applicant_contacts FOR EACH ROW EXECUTE PROCEDURE trg_validate_applicant_related_tenant()';
        EXECUTE 'DROP TRIGGER IF EXISTS trg_applicant_document_tenant ON applicant_documents';
        EXECUTE 'CREATE TRIGGER trg_applicant_document_tenant BEFORE INSERT OR UPDATE ON applicant_documents FOR EACH ROW EXECUTE PROCEDURE trg_validate_applicant_related_tenant()';
    END IF;

    -- interviews & interviewers
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_validate_interview_tenant') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trg_interview_tenant ON interviews';
        EXECUTE 'CREATE TRIGGER trg_interview_tenant BEFORE INSERT OR UPDATE ON interviews FOR EACH ROW EXECUTE PROCEDURE trg_validate_interview_tenant()';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_validate_interviewer_tenant') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trg_interviewer_tenant ON interviewers';
        EXECUTE 'CREATE TRIGGER trg_interviewer_tenant BEFORE INSERT OR UPDATE ON interviewers FOR EACH ROW EXECUTE PROCEDURE trg_validate_interviewer_tenant()';
    END IF;

    -- offers
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_validate_offer_tenant') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trg_offer_tenant ON offers';
        EXECUTE 'CREATE TRIGGER trg_offer_tenant BEFORE INSERT OR UPDATE ON offers FOR EACH ROW EXECUTE PROCEDURE trg_validate_offer_tenant()';
    END IF;

    -- notes
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_validate_notes_tenant') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trg_notes_tenant ON notes';
        EXECUTE 'CREATE TRIGGER trg_notes_tenant BEFORE INSERT OR UPDATE ON notes FOR EACH ROW EXECUTE PROCEDURE trg_validate_notes_tenant()';
    END IF;

    -- tagged_items
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_validate_tagged_item_tenant') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trg_tagged_item_tenant ON tagged_items';
        EXECUTE 'CREATE TRIGGER trg_tagged_item_tenant BEFORE INSERT OR UPDATE ON tagged_items FOR EACH ROW EXECUTE PROCEDURE trg_validate_tagged_item_tenant()';
    END IF;

    -- evaluations
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_validate_evaluation_tenant') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trg_evaluation_tenant ON evaluations';
        EXECUTE 'CREATE TRIGGER trg_evaluation_tenant BEFORE INSERT OR UPDATE ON evaluations FOR EACH ROW EXECUTE PROCEDURE trg_validate_evaluation_tenant()';
    END IF;

END$$;

-- =====================
-- ADDITIONAL HELPERS
-- =====================
-- Soft-delete helper: mark deleted_at and bump version
CREATE OR REPLACE FUNCTION soft_delete_record(p_table TEXT, p_id UUID) RETURNS VOID AS $$
BEGIN
    EXECUTE format('UPDATE %I SET deleted_at = now(), version = COALESCE(version,1) + 1 WHERE id = $1', p_table) USING p_id;
END;
$$ LANGUAGE plpgsql;

-- Convenience function: set current_tenant for session (used by RLS if enabled)
CREATE OR REPLACE FUNCTION set_current_tenant(p_tenant UUID) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant', p_tenant::text, false);
END;
$$ LANGUAGE plpgsql;

-- =====================
-- DENORMALIZED VIEW: candidate_full_profile (useful for read-heavy endpoints)
-- =====================
CREATE OR REPLACE VIEW candidate_full_profile AS
SELECT a.*, 
       (SELECT jsonb_agg(jsonb_build_object('id', d.id, 'filename', d.filename, 'document_type', d.document_type)) FROM applicant_documents d WHERE d.applicant_id = a.id) AS documents,
       (SELECT jsonb_agg(jsonb_build_object('id', c.id, 'type', c.type, 'value', c.value, 'is_preferred', c.is_preferred)) FROM applicant_contacts c WHERE c.applicant_id = a.id) AS contacts,
       (SELECT jsonb_agg(jsonb_build_object('id', ap.id, 'job_posting_id', ap.job_posting_id, 'status', ap.status, 'applied_at', ap.applied_at)) FROM applications ap WHERE ap.applicant_id = a.id) AS applications
FROM applicants a;

-- End of schema

--

-- ====================================
-- ROW-LEVEL SECURITY (RLS)
-- ====================================
ALTER TABLE job_requisitions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_contacts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviewers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagged_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rat_activity_logs   ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON job_requisitions   USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON job_postings       USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON applicants         USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON applicant_contacts USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON applicant_documents USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON pipelines          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON pipeline_stages    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON applications       USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON interviews         USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON interviewers       USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON offers             USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON notes              USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON tags               USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON tagged_items       USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON evaluations        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON rat_activity_logs  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Recruitment workflow integration (depends on applications from this migration + workflow_instances from V002)
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

CREATE TRIGGER update_recruitment_workflows_updated_at BEFORE UPDATE ON recruitment_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE recruitment_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON recruitment_workflows USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

