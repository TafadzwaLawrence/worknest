Title: Document Management Schema – Documentation

Scope
- Domain: Secure, multi-tenant document storage and management integrated across HR modules.
- Purpose: Define storage backends, document metadata, ownership links, classification/tagging, retention policies, ACL/shares, auditing, and FTS.
- Integrations: Recruitment (applicants, applications), Core HR (employees), Onboarding/Offboarding cases, Tenants, Users.
- Multitenancy: tenant_id on all tenant-scoped tables; tenant validation for polymorphic links; FK cascades for containment.
- Governance: Audit columns with updated_at triggers; soft deletes on documents/storage; FTS for search.

Database Extensions and Helpers
- uuid-ossp: UUID generation.
- citext: Available for reuse.
- update_updated_at_column(): maintain updated_at on updates.
- _get_tenant_id_for(): general helper for tenant resolution used by validation trigger(s).

Enumerated Types
- doc_owner_type: applicant, application, employee, onboarding_case, offboarding_case, other
- doc_status: active, archived, deleted
- retention_action: retain, anonymize, delete

Domain Groups
- Storage & Documents: storage_locations, documents
- Ownership & Links: document_links
- Classification & Retention: document_categories, document_tags, document_tagged_items, retention_policies, document_retention
- Access & Sharing: document_acl, document_shares
- Audit & Search: document_audit_logs, search_vector + GIN index

Tables and Structures
1) storage_locations
- Purpose: Define storage backends/buckets/containers and encryption settings.
- Columns: id UUID PK; tenant_id UUID NOT NULL; name TEXT NOT NULL; provider TEXT NOT NULL ('s3','azure_blob','gcs','filesystem','db'); bucket; base_path; encryption_enabled BOOLEAN; kms_key_id; region; is_default BOOLEAN; metadata JSONB; created_at; updated_at; deleted_at
- Constraints: UNIQUE(tenant_id, name)
- Trigger: update_storage_locations_updated_at

2) documents
- Purpose: Master document metadata with storage references and extracted text.
- Columns: id UUID PK; tenant_id UUID NOT NULL; storage_id UUID; title; filename; file_ext; content_type; content_size; storage_key; checksum; status doc_status DEFAULT 'active'; extracted_text TEXT; metadata JSONB; created_by UUID; created_at; updated_at; deleted_at; search_vector tsvector
- Indexes: idx_documents_tenant_status(tenant_id, status); idx_documents_storage(tenant_id, storage_id); idx_documents_search_vector (GIN)
- Trigger: update_documents_updated_at; trg_document_search_vector -> trg_update_document_search_vector()

3) document_links
- Purpose: Polymorphic mapping from documents to owners (applicant/application/employee/onboarding/offboarding/other).
- Columns: document_id UUID NOT NULL; tenant_id UUID NOT NULL; owner_type doc_owner_type NOT NULL; owner_id UUID NOT NULL; linked_at; linked_by UUID
- Constraints: PRIMARY KEY(document_id, owner_type, owner_id)
- Indexes: idx_document_links_owner(tenant_id, owner_type, owner_id)
- Trigger: trg_document_link_tenant -> trg_validate_document_link_tenant() (ensures owner belongs to same tenant)

4) document_categories
- Purpose: Hierarchical categories for document classification.
- Columns: id UUID PK; tenant_id UUID NOT NULL; name TEXT NOT NULL; parent_id UUID; description TEXT; created_at; updated_at
- Constraints: UNIQUE(tenant_id, name)
- Indexes: idx_document_categories_parent(tenant_id, parent_id)
- Trigger: update_document_categories_updated_at

5) document_tags
- Purpose: Free-form tag definitions per tenant.
- Columns: id UUID PK; tenant_id UUID NOT NULL; name TEXT NOT NULL; color TEXT; created_at
- Constraints: UNIQUE(tenant_id, lower(name))

6) document_tagged_items
- Purpose: M:N map of tags to documents.
- Columns: tag_id UUID NOT NULL; document_id UUID NOT NULL; tenant_id UUID NOT NULL; created_at
- Constraints: PRIMARY KEY(tag_id, document_id)

7) retention_policies
- Purpose: Retention definitions by category/tag or global 'all'.
- Columns: id UUID PK; tenant_id UUID NOT NULL; name TEXT NOT NULL; applies_to TEXT NOT NULL ('category','tag','all'); category_id UUID; tag_id UUID; retain_for_months INT NOT NULL; action retention_action DEFAULT 'retain'; legal_hold BOOLEAN DEFAULT false; created_at; updated_at
- Constraints: UNIQUE(tenant_id, name)
- Indexes: idx_retention_policies_target(tenant_id, applies_to, category_id, tag_id)
- Trigger: update_retention_policies_updated_at

8) document_retention
- Purpose: Track retention evaluation and next action for a document.
- Columns: document_id UUID PK; tenant_id UUID NOT NULL; policy_id UUID; next_review_at DATE; next_action retention_action; legal_hold BOOLEAN DEFAULT false; updated_at
- Indexes: idx_document_retention_review(tenant_id, next_review_at)
- Trigger: update_document_retention_updated_at

9) document_acl
- Purpose: Row-level ACL entries (user/role/department) with permissions flags.
- Columns: id UUID PK; document_id UUID NOT NULL; tenant_id UUID NOT NULL; principal_type TEXT NOT NULL; principal_id UUID; can_read/write/delete/share BOOLEANs; created_at
- Constraints: UNIQUE(document_id, principal_type, principal_id)
- Indexes: idx_document_acl_principal(tenant_id, principal_type, principal_id)
- Trigger: update_document_acl_updated_at

10) document_shares
- Purpose: External share links with expiry and limited actions.
- Columns: id UUID PK; document_id UUID NOT NULL; tenant_id UUID NOT NULL; token TEXT NOT NULL; expires_at; allowed_actions TEXT[] DEFAULT ['read']; created_by UUID; created_at
- Constraints: UNIQUE(document_id, token)
- Indexes: idx_document_shares_token(tenant_id, token)
- Trigger: update_document_shares_updated_at

11) document_audit_logs
- Purpose: Audit log for document events (upload/update/download/share/ACL change/delete/restore).
- Columns: id UUID PK; tenant_id UUID NOT NULL; document_id UUID NOT NULL; actor_user_id UUID; event TEXT NOT NULL; ip_address TEXT; user_agent TEXT; details JSONB; created_at
- Indexes: idx_document_audit_document(tenant_id, document_id, created_at)

FTS
- Search vector maintained on documents via trg_update_document_search_vector(); index: idx_documents_search_vector (GIN).

Tenant Validation
- trg_validate_document_link_tenant ensures the owner record belongs to the same tenant (supports applicants, applications, employees, onboarding_cases, offboarding_cases; 'other' handled by app policies).

Operational Notes
- Storage locations allow per-tenant default backends and encryption policies.
- Retention policies can be applied by category/tag or globally; document_retention tracks next action.
- ACLs govern row-level access; document_shares enable temporary external access.
- Soft deletes on documents/storage_locations via deleted_at.

End of documentation.