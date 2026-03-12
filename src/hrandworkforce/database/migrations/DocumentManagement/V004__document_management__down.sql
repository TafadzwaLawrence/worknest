-- ============================================================
-- DOWN: V004 — Document Management
-- Reverses document management tables, types, and functions.
-- Run before V003 when rolling back.
-- ============================================================

-- Drop tables in reverse creation order
DROP TABLE IF EXISTS document_audit_logs CASCADE;
DROP TABLE IF EXISTS document_shares CASCADE;
DROP TABLE IF EXISTS document_acl CASCADE;
DROP TABLE IF EXISTS document_retention CASCADE;
DROP TABLE IF EXISTS retention_policies CASCADE;
DROP TABLE IF EXISTS document_tagged_items CASCADE;
DROP TABLE IF EXISTS document_tags CASCADE;
DROP TABLE IF EXISTS document_categories CASCADE;
DROP TABLE IF EXISTS document_links CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS storage_locations CASCADE;

-- Drop module-specific functions (triggers + helpers)
-- _get_tenant_id_for() is also used by V005 and V010; those modules
-- redefine it with CREATE OR REPLACE so it is safe to drop here only
-- when running a full rollback (V010→V001 order ensures V010 ran first).
DROP FUNCTION IF EXISTS trg_validate_document_link_tenant() CASCADE;
DROP FUNCTION IF EXISTS trg_update_document_search_vector() CASCADE;
DROP FUNCTION IF EXISTS _get_tenant_id_for(TEXT, UUID) CASCADE;

-- Drop enum types unique to this module
DROP TYPE IF EXISTS retention_action CASCADE;
DROP TYPE IF EXISTS doc_status CASCADE;
DROP TYPE IF EXISTS doc_owner_type CASCADE;

-- Note: update_updated_at_column() is owned by V001; not dropped here.
