Title: Employee Self-Service (ESS) Schema – Documentation

Scope
- Domain: Employee portal for managing personal info, time-off initiation, document acknowledgments, and portal preferences.
- Purpose: Provide tenant-scoped ESS settings, user preferences, profile change requests, time-off drafts and mappings, document acknowledgments and access logs, and attachments.
- Integrations: Core (employees, users), Leave (leave_requests), Document Management (documents), Workflows (optional linkage), Tenants.
- Multitenancy: tenant_id on all tenant-scoped tables; tenant consistency validated via triggers using _get_tenant_id_for.
- Governance: Audit columns and uniform updated_at triggers; soft delete on selected tables not present except where needed.

Database Extensions and Helpers
- uuid-ossp: for uuid_generate_v4() PKs.
- citext: available if needed.
- update_updated_at_column(): maintains updated_at on updates.
- _get_tenant_id_for(table_name, row_id): helper to fetch tenant_id for tenant validation triggers.

Enumerated Types
- ess_request_status: draft, submitted, under_review, approved, rejected, cancelled
- ess_ack_status: required, acknowledged, waived
- ess_owner_type: profile_request, time_off_draft, acknowledgment
- access_type: view, download

Domain Groups
- Tenant & Preferences: ess_settings, ess_portal_preferences
- Profile Updates: ess_profile_requests, ess_profile_request_items
- Time-off Portal: ess_time_off_drafts, ess_time_off_portal
- Documents & Policies: ess_required_acknowledgments, ess_acknowledgments, ess_document_access
- Attachments: ess_attachments
- Views: ess_employee_dashboard
- Ops: Indexes and tenant validation & updated_at triggers

Tables and Structures
1) ess_settings
- Purpose: Tenant-level ESS configuration and branding.
- Columns: id UUID PK; tenant_id UUID UNIQUE NOT NULL; features JSONB (feature toggles); portal_branding JSONB; created_at; updated_at
- Indexes: idx_ess_settings_tenant(tenant_id)
- Trigger: update_ess_settings_updated_at

2) ess_portal_preferences
- Purpose: Per-employee portal preferences (locale/timezone/notifications/theme).
- Columns: id UUID PK; tenant_id UUID NOT NULL; employee_id UUID NOT NULL; locale; timezone; notifications JSONB; theme JSONB; created_at; updated_at
- Constraints: UNIQUE(tenant_id, employee_id)
- Indexes: idx_ess_prefs_employee(tenant_id, employee_id)
- Triggers: update_ess_prefs_updated_at; trg_ess_prefs_tenant -> trg_validate_ess_employee_tenant()

3) ess_profile_requests
- Purpose: Employee-submitted change requests for PII with approval/audit metadata.
- Columns: id UUID PK; tenant_id UUID NOT NULL; employee_id UUID NOT NULL; request_type TEXT; requested_changes JSONB; status ess_request_status DEFAULT 'submitted'; submitted_at; reviewed_by UUID; reviewed_at; review_comments; effective_date; workflow_instance_id UUID (optional); metadata JSONB; created_at; updated_at; deleted_at
- Indexes: idx_ess_profile_requests_status(tenant_id, status); idx_ess_profile_requests_emp(tenant_id, employee_id, submitted_at DESC)
- Triggers: update_ess_profile_requests_updated_at; trg_ess_profile_requests_tenant

4) ess_profile_request_items
- Purpose: Granular change items within a profile request for auditability.
- Columns: id UUID PK; tenant_id UUID NOT NULL; request_id UUID NOT NULL; field_path TEXT; old_value JSONB; new_value JSONB; created_at
- Indexes: idx_ess_profile_items_req(tenant_id, request_id)
- Trigger: update_ess_profile_request_items_updated_at

5) ess_time_off_drafts
- Purpose: Save drafts before submitting final leave_requests.
- Columns: id UUID PK; tenant_id UUID NOT NULL; employee_id UUID NOT NULL; draft_data JSONB; created_at; updated_at
- Indexes: idx_ess_timeoff_drafts_emp(tenant_id, employee_id, updated_at DESC)
- Triggers: update_ess_timeoff_drafts_updated_at; trg_ess_timeoff_drafts_tenant

6) ess_time_off_portal
- Purpose: ESS mapping layer to submitted leave_requests with portal metadata.
- Columns: id UUID PK; tenant_id UUID NOT NULL; employee_id UUID NOT NULL; leave_request_id UUID NOT NULL; submitted_from TEXT DEFAULT 'web'; attachments JSONB; notes TEXT; created_at; updated_at
- Constraints: UNIQUE(tenant_id, leave_request_id)
- Indexes: idx_ess_timeoff_portal_lr(tenant_id, leave_request_id)
- Triggers: update_ess_timeoff_portal_updated_at; trg_ess_timeoff_portal_tenant; trg_ess_timeoff_portal_leave_tenant

7) ess_required_acknowledgments
- Purpose: Assign policy documents that require acknowledgment.
- Columns: id UUID PK; tenant_id UUID NOT NULL; document_id UUID NOT NULL; effective_from DATE DEFAULT CURRENT_DATE; effective_to DATE; target JSONB; created_by UUID; created_at; updated_at
- Constraints: UNIQUE(tenant_id, document_id, effective_from)
- Indexes: idx_ess_required_ack(tenant_id, document_id, effective_from)
- Triggers: update_ess_required_ack_updated_at; trg_ess_required_ack_doc_tenant

8) ess_acknowledgments
- Purpose: Track employee acknowledgments for required documents.
- Columns: id UUID PK; tenant_id UUID NOT NULL; employee_id UUID NOT NULL; document_id UUID NOT NULL; status ess_ack_status DEFAULT 'required'; acked_at; ack_version; comments; created_at; updated_at
- Constraints: UNIQUE(tenant_id, employee_id, document_id)
- Indexes: idx_ess_acks_emp(tenant_id, employee_id, status)
- Triggers: update_ess_acks_updated_at; trg_ess_acks_doc_tenant; trg_ess_profile_requests_tenant (employee validation via shared function)

9) ess_document_access
- Purpose: Audit of document views/downloads from ESS.
- Columns: id UUID PK; tenant_id UUID NOT NULL; employee_id UUID NOT NULL; document_id UUID NOT NULL; access access_type NOT NULL; ip_address; user_agent; accessed_at DEFAULT now()
- Indexes: idx_ess_doc_access_emp(tenant_id, employee_id, accessed_at DESC)
- Triggers: update_ess_doc_access_updated_at; trg_ess_doc_access_doc_tenant; trg_ess_prefs_tenant (employee validation via shared function)

10) ess_attachments
- Purpose: Attach documents to ESS entities (profile requests, time-off drafts) polymorphically.
- Columns: id UUID PK; tenant_id UUID NOT NULL; owner_type ess_owner_type NOT NULL; owner_id UUID NOT NULL; document_id UUID NOT NULL; created_by UUID; created_at
- Indexes: idx_ess_attachments_owner(tenant_id, owner_type, owner_id)
- Triggers: update_ess_attachments_updated_at; trg_ess_attachments_doc_tenant

Tenant Validation Triggers
- trg_validate_ess_employee_tenant: Ensures employee_id belongs to same tenant (used by preferences, profile_requests, time_off_drafts, time_off_portal).
- trg_validate_ess_doc_tenant: Ensures document_id belongs to same tenant (used by required_acknowledgments, acknowledgments, document_access, attachments).
- trg_validate_ess_leave_tenant: Ensures leave_request_id belongs to same tenant (used by ess_time_off_portal).

Views
- ess_employee_dashboard
  - Presents a portal snapshot: counts of pending profile requests, pending leave requests, required acknowledgment count, and 5 most recent documents accessed by the employee.
  - Data sources: employees, ess_profile_requests, leave_requests, ess_acknowledgments, ess_document_access.

Operational Notes
- Workflow linkage: profile requests can optionally link to workflow instances for approvals.
- Draft pattern: time-off drafts enable client-side UX before creating leave_requests.
- Acknowledgments: required documents per tenant drive compliance; acknowledgments track status and version.

End of documentation.