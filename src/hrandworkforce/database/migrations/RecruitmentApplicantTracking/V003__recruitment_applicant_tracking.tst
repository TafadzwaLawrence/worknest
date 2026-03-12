Title: Recruitment & Applicant Tracking (RAT) Schema – Documentation

Scope
- Domain: Recruitment and applicant tracking within a multi-tenant HR system.
- Purpose: Model requisitions, postings, candidates, applications, interviews, offers, notes, tags, evaluations, and activity logs.
- Multitenancy: All tenant-scoped tables include tenant_id; strict tenant isolation enforced via FKs and validation triggers.
- Governance: Audit columns (created_at, updated_at), soft deletes (deleted_at) on key entities, optimistic versioning (version), and FTS indexes.

Database Extensions and Helpers
- uuid-ossp: provides uuid_generate_v4() for primary keys.
- citext: case-insensitive text for emails and usernames where used.
- update_updated_at_column(): generic trigger function to set NEW.updated_at to CURRENT_TIMESTAMP on updates.

Enumerated Types
- job_status: open, on_hold, closed, cancelled
- application_status: applied, screening, phone_screen, assessment, interviewing, offer, hired, rejected, withdrawn
- interview_status: scheduled, rescheduled, completed, cancelled, no_show
- offer_status: pending, approved, issued, accepted, declined, withdrawn
- contact_type: email, phone, mobile, linkedin, twitter, other
- document_type: resume, cover_letter, portfolio, transcript, certificate, id_proof, visa, work_permit, reference_letter, performance_review, contract, offer_letter, background_check, driving_license, passport, degree, diploma, other
- note_visibility: private, team, public

Core Entities and Structures
1) job_requisitions
- Purpose: Hiring need/req capturing role, headcount, hiring manager, compensation, and status.
- Key columns (as evident in DDL fragment and references)
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - reference_code TEXT UNIQUE per tenant (e.g., REQ-2025-001)
  - title TEXT NOT NULL
  - department TEXT, location TEXT
  - employment_type TEXT
  - hiring_manager_id UUID REFERENCES users(id) ON DELETE SET NULL
  - recruiter_id UUID REFERENCES users(id) ON DELETE SET NULL
  - headcount INT DEFAULT 1
  - status job_status DEFAULT 'open'
  - compensation_range JSONB
  - description TEXT
  - metadata JSONB DEFAULT '{}'
  - created_by, updated_by UUID REFERENCES users(id)
  - created_at, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - deleted_at TIMESTAMPTZ, version INT DEFAULT 1
  - UNIQUE(tenant_id, reference_code)
- Indexes: idx_job_requisitions_tenant_ref(tenant_id, reference_code)
- Triggers: update_job_requisitions_updated_at

2) job_postings
- Purpose: Public-facing postings derived from requisitions with publish windows and FTS.
- Columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - requisition_id UUID REFERENCES job_requisitions(id) ON DELETE SET NULL
  - external_id TEXT
  - title TEXT NOT NULL, slug TEXT UNIQUE per (tenant_id, requisition_id)
  - summary TEXT, full_description TEXT
  - location TEXT, is_remote BOOLEAN DEFAULT false
  - employment_type TEXT, compensation_range JSONB
  - is_published BOOLEAN DEFAULT false, publish_at, expire_at TIMESTAMPTZ
  - apply_url TEXT, metadata JSONB DEFAULT '{}'
  - created_by, updated_by UUID REFERENCES users(id)
  - created_at, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - deleted_at TIMESTAMPTZ, version INT DEFAULT 1
  - search_vector tsvector (FTS)
- Indexes: idx_job_postings_publish(tenant_id,is_published,publish_at); idx_job_postings_requisition(tenant_id,requisition_id); idx_job_postings_search_vector (GIN); idx_job_postings_metadata_gin (GIN)
- Triggers
  - update_job_postings_updated_at
  - trg_job_posting_tenant -> trg_validate_job_posting_tenant()
  - FTS: trg_job_postings_search_vector -> trg_update_job_postings_search_vector()

3) applicants
- Purpose: Candidate master profile with parsed resume text and FTS support.
- Columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - first_name, last_name, preferred_name
  - email CITEXT
  - phone TEXT, current_title TEXT, current_company TEXT, location TEXT
  - headline TEXT, resume_text TEXT
  - profile JSONB DEFAULT '{}'
  - source TEXT
  - created_by, updated_by UUID REFERENCES users(id)
  - created_at, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - deleted_at TIMESTAMPTZ, version INT DEFAULT 1
  - resume_search tsvector (FTS)
  - UNIQUE(tenant_id, lower(email))
- Indexes: idx_applicants_tenant_name(tenant_id, lower(last_name), lower(first_name)); idx_applicants_email(tenant_id, lower(email)); idx_applicants_resume_search (GIN); idx_applicants_profile_gin (GIN)
- Triggers: update_applicants_updated_at; FTS trg_applicants_resume_search -> trg_update_applicants_resume_search_vector()

4) applicant_contacts
- Purpose: Additional contact points for applicants.
- Columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE
  - type contact_type NOT NULL, value TEXT NOT NULL, is_preferred BOOLEAN DEFAULT false
  - metadata JSONB DEFAULT '{}', created_by UUID REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT now()
- Triggers: trg_applicant_contact_tenant -> trg_validate_applicant_related_tenant()

5) applicant_documents
- Purpose: Uploaded candidate documents and extracted text for search.
- Columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE
  - document_type document_type DEFAULT 'resume'
  - filename, content_type, content_size, storage_key TEXT NOT NULL, file_hash TEXT
  - extracted_text TEXT, metadata JSONB DEFAULT '{}'
  - uploaded_by UUID REFERENCES users(id), uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
- Indexes: idx_applicant_doc_metadata (GIN)
- Triggers: trg_applicant_document_tenant -> trg_validate_applicant_related_tenant()

6) pipelines
- Purpose: Recruitment pipelines per tenant with named stages.
- Columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - name TEXT NOT NULL, description TEXT, created_by UUID REFERENCES users(id)
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - UNIQUE(tenant_id, name)

7) pipeline_stages
- Purpose: Ordered stages in a pipeline controlling progression.
- Columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - name TEXT NOT NULL, position INT DEFAULT 0, is_active BOOLEAN DEFAULT true, requires_assessment BOOLEAN DEFAULT false
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - UNIQUE(pipeline_id, name)
- Triggers: trg_pipeline_stage_tenant -> trg_validate_pipeline_stage_tenant()

8) applications
- Purpose: Candidate applications linked to postings/requisitions/pipelines with status tracking.
- Columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE
  - job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE
  - requisition_id UUID REFERENCES job_requisitions(id) ON DELETE SET NULL
  - pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL
  - stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL
  - source TEXT, status application_status DEFAULT 'applied'
  - apply_reference TEXT, applied_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ
  - created_by, updated_by UUID REFERENCES users(id)
  - version INT DEFAULT 1, metadata JSONB DEFAULT '{}'
- Constraints: UNIQUE (tenant_id, applicant_id, job_posting_id) WHERE deleted_at IS NULL (ux_applicant_job_active)
- Indexes: idx_applications_status(tenant_id, status); idx_applications_job(tenant_id, job_posting_id); idx_applications_metadata_gin (GIN)
- Triggers: update_applications_updated_at; trg_application_tenant -> trg_validate_application_tenant()

9) interviews
- Purpose: Interview scheduling with agenda, status, timing, and metadata.
- Columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE
  - scheduled_by UUID REFERENCES users(id)
  - start_at TIMESTAMPTZ NOT NULL, end_at TIMESTAMPTZ NOT NULL
  - timezone TEXT, location TEXT, mode TEXT
  - agenda TEXT, status interview_status DEFAULT 'scheduled', cancelled_reason TEXT
  - created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), metadata JSONB DEFAULT '{}'
- Indexes: idx_interviews_start(tenant_id, start_at)
- Triggers: update_interviews_updated_at; trg_interview_tenant -> trg_validate_interview_tenant()

10) interviewers
- Purpose: Junction table linking interviews to user panelists with roles and feedback.
- Columns
  - interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE
  - user_id UUID REFERENCES users(id) ON DELETE SET NULL
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - role TEXT, is_primary BOOLEAN DEFAULT false, attended BOOLEAN DEFAULT false
  - feedback JSONB, score NUMERIC(5,2), created_at TIMESTAMPTZ DEFAULT now()
  - PRIMARY KEY (interview_id, user_id)
- Triggers: trg_interviewer_tenant -> trg_validate_interviewer_tenant()

11) offers
- Purpose: Job offers with compensation, benefits, timestamps, and status.
- Columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE
  - offered_by UUID REFERENCES users(id), hiring_manager_id UUID REFERENCES users(id)
  - compensation JSONB, benefits JSONB
  - status offer_status DEFAULT 'pending'
  - issued_at TIMESTAMPTZ DEFAULT now(), accepted_at, declined_at, withdrawn_at TIMESTAMPTZ
  - created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), metadata JSONB DEFAULT '{}'
- Indexes: idx_offers_status(tenant_id, status)
- Triggers: update_offers_updated_at; trg_offer_tenant -> trg_validate_offer_tenant()

12) notes (polymorphic)
- Purpose: Polymorphic notes for applicants, applications, requisitions, job_postings, interviews, offers.
- Columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - parent_type TEXT NOT NULL, parent_id UUID NOT NULL
  - created_by UUID REFERENCES users(id)
  - visibility note_visibility DEFAULT 'private'
  - body TEXT, attachments JSONB
  - created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
- Triggers: update_notes_updated_at; trg_notes_tenant -> trg_validate_notes_tenant()

13) tags and tagged_items (polymorphic tagging)
- tags
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - name TEXT NOT NULL, color TEXT, metadata JSONB DEFAULT '{}'
  - created_at TIMESTAMPTZ DEFAULT now()
  - UNIQUE(tenant_id, lower(name))
  - Indexes: idx_tags_tenant_name(tenant_id, lower(name))
- tagged_items
  - tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - item_type TEXT NOT NULL, item_id UUID NOT NULL
  - created_by UUID REFERENCES users(id)
  - created_at TIMESTAMPTZ DEFAULT now()
  - PRIMARY KEY (tag_id, item_type, item_id)
  - Triggers: trg_tagged_item_tenant -> trg_validate_tagged_item_tenant()

14) evaluations
- Purpose: Evaluations with criteria, scores, and pass/fail across entities.
- Columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - application_id UUID REFERENCES applications(id) ON DELETE SET NULL
  - applicant_id UUID REFERENCES applicants(id) ON DELETE SET NULL
  - interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL
  - evaluator_id UUID REFERENCES users(id) ON DELETE SET NULL
  - score NUMERIC(6,2), criteria JSONB, passed BOOLEAN, comments TEXT
  - created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
- Triggers: update_evaluations_updated_at; trg_evaluation_tenant -> trg_validate_evaluation_tenant()

15) rat_activity_logs
- Purpose: Lightweight activity trail for RAT operations (actor, target, action).
- Columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - actor_id UUID REFERENCES users(id)
  - action TEXT NOT NULL, target_type TEXT, target_id UUID, data JSONB DEFAULT '{}'
  - created_at TIMESTAMPTZ DEFAULT now()

Indexes Summary
- job_postings: publish window; requisition; search_vector (GIN); metadata (GIN)
- job_requisitions: tenant + reference_code
- applicants: name lookup; email lookup; resume_search (GIN); profile (GIN)
- applications: tenant + status; tenant + job_posting_id; metadata (GIN); soft-delete-aware uniqueness for applicant+posting
- interviews: tenant + start_at
- offers: tenant + status
- tags: tenant + lower(name)

Full-Text Search (FTS)
- job_postings.search_vector
  - Trigger function: trg_update_job_postings_search_vector()
  - Trigger: trg_job_postings_search_vector (BEFORE INSERT/UPDATE)
- applicants.resume_search
  - Trigger function: trg_update_applicants_resume_search_vector()
  - Trigger: trg_applicants_resume_search (BEFORE INSERT/UPDATE)

Tenant Validation Triggers
- trg_validate_job_posting_tenant: Requisition must belong to same tenant.
- trg_validate_pipeline_stage_tenant: Stage pipeline tenant must match.
- trg_validate_application_tenant: Applicant, posting, requisition, pipeline, and stage must match tenant.
- trg_validate_applicant_related_tenant: Applicant contacts/documents must match the applicant tenant.
- trg_validate_interview_tenant: Application must match tenant.
- trg_validate_interviewer_tenant: Interview must match tenant.
- trg_validate_offer_tenant: Application must match tenant.
- trg_validate_notes_tenant: Notes polymorphic parent must match tenant.
- trg_validate_tagged_item_tenant: Tag and tagged item must match tenant.
- trg_validate_evaluation_tenant: Optional links (application/applicant/interview) must match tenant.
- Re-attachment block ensures triggers persist if functions exist.

Helpers & Utilities
- set_updated_at_column(): Generic updated_at/version bump on update (note: explicit update_updated_at_column() triggers are used on most tables).
- _get_tenant_id_for(table_name, row_id): Helper to fetch tenant_id for arbitrary tables used in tenant validation triggers.
- soft_delete_record(p_table, p_id): Marks deleted_at and bumps version.
- set_current_tenant(p_tenant): Stores tenant id in app.current_tenant GUC; useful for RLS.

Views
- candidate_full_profile: Denormalized view of applicants with nested documents, contacts, and applications (JSONB aggregates).

Cross-Module Dependencies
- tenants(id): tenant scoping anchor.
- users(id): authors, interviewers, managers, evaluators.
- References to extended module tables in update triggers (requisition_approvals, job_posting_channels, referrals, background_checks, assessments); these tables are expected in extended RAT modules.

Operational Notes
- Soft delete and versioning allow safe logical deletion and optimistic concurrency.
- FTS enables efficient search across postings and resumes.
- Partial uniqueness on applications prevents duplicate active applications per applicant/posting.
- Tenant validation triggers enforce strict isolation across all polymorphic usages.

End of documentation.