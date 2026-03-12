-- =====================
-- DOCUMENT MANAGEMENT SCHEMA (Workforce Operations & Management)
-- Extends the existing HR & Workforce Management System
-- Design principles:
--   - Single shared-database multi-tenant model (tenant_id UUID on tenant-scoped tables)
--   - Integrations with Recruitment (applicants, applications), Employees, and On/Offboarding Cases
--   - Secure storage references, metadata, classification, retention, and access controls
--   - Full-text search for titles and extracted content; audit trails; explicit updated_at triggers
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

-- Helper for tenant resolution
CREATE OR REPLACE FUNCTION _get_tenant_id_for(table_name TEXT, row_id UUID) RETURNS UUID AS $$
DECLARE tenant UUID; sql TEXT; BEGIN
    sql := format('SELECT tenant_id FROM %I WHERE id = $1', table_name);
    EXECUTE sql INTO tenant USING row_id;
    RETURN tenant;
END;$$ LANGUAGE plpgsql;

-- =====================
-- ENUMS / TYPE DEFINITIONS
-- =====================
DO $$ BEGIN CREATE TYPE doc_owner_type AS ENUM ('applicant','application','employee','onboarding_case','offboarding_case','other'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE doc_status AS ENUM ('active','archived','deleted'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE retention_action AS ENUM ('retain','anonymize','delete'); EXCEPTION WHEN duplicate_object THEN null; END; $$;

/*
====================================
DOCUMENT MANAGEMENT DOMAIN GROUPS
- Storage & Documents: storage_locations, documents
- Ownership & Links: document_links (polymorphic owner mapping)
- Classification & Retention: document_categories, document_tags, document_tagged_items, retention_policies, document_retention
- Access Controls & Sharing: document_acl, document_shares
- Audit & Search: document_audit_logs, FTS on titles/content
- Ops/Indexes/Triggers: performance indexes and explicit updated_at triggers
====================================
*/

-- =====================
-- STORAGE & DOCUMENTS
-- =====================
/*
Table: storage_locations
Use: Defines storage backends/buckets/containers with connection details and encryption flags.
*/
CREATE TABLE IF NOT EXISTS storage_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    provider TEXT NOT NULL, -- 's3','azure_blob','gcs','filesystem','db'
    bucket TEXT,
    base_path TEXT,
    encryption_enabled BOOLEAN DEFAULT true,
    kms_key_id TEXT,
    region TEXT,
    is_default BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

/*
Table: documents
Use: Master table of documents with storage references, content metadata and FTS fields.
*/
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    storage_id UUID REFERENCES storage_locations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_ext TEXT,
    content_type TEXT,
    content_size BIGINT,
    storage_key TEXT NOT NULL, -- object key/path
    checksum TEXT, -- sha256 or similar
    status doc_status DEFAULT 'active',
    extracted_text TEXT, -- for FTS
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Full-text search vectors
ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- =====================
-- OWNERSHIP & LINKS (polymorphic)
-- =====================
/*
Table: document_links
Use: Maps a document to its owner (applicant/application/employee/onboarding/offboarding).
*/
CREATE TABLE IF NOT EXISTS document_links (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_type doc_owner_type NOT NULL,
    owner_id UUID NOT NULL,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    linked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (document_id, owner_type, owner_id)
);

-- =====================
-- CLASSIFICATION & RETENTION
-- =====================
/*
Table: document_categories
Use: Hierarchical categories for documents (policies, IDs, contracts, etc.).
*/
CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES document_categories(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);

/*
Table: document_tags
Use: Free-form tags within a tenant.
*/
CREATE TABLE IF NOT EXISTS document_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_document_tags_tenant_name ON document_tags (tenant_id, lower(name));

/*
Table: document_tagged_items
Use: M:N mapping from tags to documents.
*/
CREATE TABLE IF NOT EXISTS document_tagged_items (
    tag_id UUID NOT NULL REFERENCES document_tags(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tag_id, document_id)
);

/*
Table: retention_policies
Use: Defines retention periods and actions per category/tag.
*/
CREATE TABLE IF NOT EXISTS retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    applies_to TEXT NOT NULL, -- 'category','tag','all'
    category_id UUID REFERENCES document_categories(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES document_tags(id) ON DELETE CASCADE,
    retain_for_months INT NOT NULL,
    action retention_action DEFAULT 'retain',
    legal_hold BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);

/*
Table: document_retention
Use: Tracks retention evaluation and next action for a document.
*/
CREATE TABLE IF NOT EXISTS document_retention (
    document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES retention_policies(id) ON DELETE SET NULL,
    next_review_at DATE,
    next_action retention_action,
    legal_hold BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- ACCESS CONTROLS & SHARING
-- =====================
/*
Table: document_acl
Use: Row-level access control entries by user/role/department with permissions.
*/
CREATE TABLE IF NOT EXISTS document_acl (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    principal_type TEXT NOT NULL, -- 'user','role','department'
    principal_id UUID,
    can_read BOOLEAN DEFAULT true,
    can_write BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_share BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (document_id, principal_type, principal_id)
);

/*
Table: document_shares
Use: External share links with expiry and limited permissions.
*/
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    allowed_actions TEXT[] DEFAULT ARRAY['read'], -- 'read','download'
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (document_id, token)
);

-- =====================
-- AUDIT & SEARCH
-- =====================
/*
Table: document_audit_logs
Use: Audit log of document events (upload/update/download/share/access changes).
*/
CREATE TABLE IF NOT EXISTS document_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event TEXT NOT NULL, -- 'upload','update','download','share','acl_change','delete','restore'
    ip_address TEXT,
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FTS index
CREATE INDEX IF NOT EXISTS idx_documents_search_vector ON documents USING GIN (search_vector);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_documents_tenant_status ON documents (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_storage ON documents (tenant_id, storage_id);
CREATE INDEX IF NOT EXISTS idx_document_links_owner ON document_links (tenant_id, owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_document_categories_parent ON document_categories (tenant_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_retention_policies_target ON retention_policies (tenant_id, applies_to, category_id, tag_id);
CREATE INDEX IF NOT EXISTS idx_document_retention_review ON document_retention (tenant_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_document_acl_principal ON document_acl (tenant_id, principal_type, principal_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares (tenant_id, token);
CREATE INDEX IF NOT EXISTS idx_document_audit_document ON document_audit_logs (tenant_id, document_id, created_at);

-- =====================
-- TRIGGERS & FUNCTIONS (VALIDATION & AUDIT)
-- =====================
-- updated_at triggers
CREATE TRIGGER update_storage_locations_updated_at BEFORE UPDATE ON storage_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_categories_updated_at BEFORE UPDATE ON document_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_retention_policies_updated_at BEFORE UPDATE ON retention_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_retention_updated_at BEFORE UPDATE ON document_retention FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_acl_updated_at BEFORE UPDATE ON document_acl FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_shares_updated_at BEFORE UPDATE ON document_shares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FTS trigger to maintain search_vector
CREATE OR REPLACE FUNCTION trg_update_document_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', coalesce(NEW.title,'') || ' ' || coalesce(NEW.filename,'') || ' ' || coalesce(NEW.extracted_text,''));
    RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_document_search_vector ON documents;
CREATE TRIGGER trg_document_search_vector BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE PROCEDURE trg_update_document_search_vector();

-- Tenant validation for document_links
CREATE OR REPLACE FUNCTION trg_validate_document_link_tenant() RETURNS trigger AS $$
DECLARE item_t UUID; BEGIN
    CASE NEW.owner_type
        WHEN 'applicant' THEN item_t := _get_tenant_id_for('applicants', NEW.owner_id);
        WHEN 'application' THEN item_t := _get_tenant_id_for('applications', NEW.owner_id);
        WHEN 'employee' THEN item_t := _get_tenant_id_for('employees', NEW.owner_id);
        WHEN 'onboarding_case' THEN item_t := _get_tenant_id_for('onboarding_cases', NEW.owner_id);
        WHEN 'offboarding_case' THEN item_t := _get_tenant_id_for('offboarding_cases', NEW.owner_id);
        ELSE item_t := NEW.tenant_id; -- other/custom owner types handled by app policy
    END CASE;
    IF item_t IS NULL OR item_t != NEW.tenant_id THEN RAISE EXCEPTION 'tenant mismatch between document_link and owner'; END IF;
    RETURN NEW; END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_document_link_tenant ON document_links;
CREATE TRIGGER trg_document_link_tenant BEFORE INSERT OR UPDATE ON document_links FOR EACH ROW EXECUTE PROCEDURE trg_validate_document_link_tenant();

-- End of Document Management schema
