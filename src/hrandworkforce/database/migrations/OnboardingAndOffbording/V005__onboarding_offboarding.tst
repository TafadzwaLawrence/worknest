Title: Employee Onboarding & Offboarding Schema – Documentation

Scope
- Domain: Workforce Operations & Management
- Purpose: Manage employee onboarding and offboarding through templates, cases, tasks, provisioning/access requests, asset tracking, exit processes, and collaboration notes.
- Integrations: Recruitment (applicants, applications, offers), Core HR (employees, users, departments), optional linkage to workflow instances (from workflows module).
- Multitenancy: Single shared database model with tenant_id on tenant-scoped tables, tenant consistency validated by triggers and FKs.
- Governance: Audit fields, soft deletes on select entities, and uniform updated_at triggers.

Design Principles
- Single shared DB (multi-tenant) with strong tenant isolation.
- Soft deletes using deleted_at on templates, cases, and case tasks (onboarding/offboarding).
- Uniform updated_at trigger for row updates.
- Template-driven case instantiation for consistency and scalability.
- Optional integration to workflow engine for approvals/SLA.

Database Extensions
- uuid-ossp: for uuid_generate_v4() primary keys.
- citext: case-insensitive text (available for reuse if needed).

Utility Functions
- update_updated_at_column(): Trigger function to set NEW.updated_at = CURRENT_TIMESTAMP on updates.
- _get_tenant_id_for(table_name TEXT, row_id UUID): Helper to fetch tenant_id for any row (used by tenant validation triggers).

Enumerated Types
- onboarding_status: planned, active, on_hold, completed, cancelled
- offboarding_status: planned, active, on_hold, completed, cancelled
- task_status: pending, in_progress, blocked, completed, cancelled
- case_type: onboarding, offboarding
- priority_level: low, normal, high, urgent
- provision_status: requested, approved, provisioned, revoked, rejected, cancelled
- asset_type: laptop, desktop, mobile, access_card, key, software_license, other
- note_visibility: private, team, public

Logical Domains
- Templates
  - onboarding_templates
  - onboarding_template_tasks
  - offboarding_templates
  - offboarding_template_tasks
- Cases and Tasks
  - onboarding_cases
  - onboarding_case_tasks
  - offboarding_cases
  - offboarding_case_tasks
- Provisioning / Access & Assets
  - provisioning_requests
  - asset_assignments
- Exit & Knowledge Transfer
  - exit_interviews
  - knowledge_transfer_records
  - clearance_checklist_items
- Collaboration Notes
  - onboarding_notes
  - offboarding_notes
- Reporting Views
  - onboarding_case_overview
  - offboarding_case_overview

Tables and Structures
1) onboarding_templates
- Purpose: Reusable onboarding plan templates.
- Key fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - name TEXT NOT NULL
  - description TEXT
  - is_active BOOLEAN DEFAULT true
  - created_by UUID REFERENCES users(id)
  - created_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ DEFAULT now()
  - deleted_at TIMESTAMPTZ (soft delete)
- Constraints: UNIQUE(tenant_id, name)
- Indexes: idx_onboarding_templates_tenant(tenant_id)
- Triggers: update_onboarding_templates_updated_at -> update_updated_at_column()

2) onboarding_template_tasks
- Purpose: Task definitions within an onboarding template (relative schedule).
- Key fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - template_id UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE
  - name TEXT NOT NULL
  - description TEXT
  - relative_day_offset INT DEFAULT 0 (days from case start_date)
  - priority priority_level DEFAULT 'normal'
  - required BOOLEAN DEFAULT true
  - assigned_to_type TEXT (e.g., user, role, department, manager, it, hr)
  - assigned_to_id UUID
  - created_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ DEFAULT now()
- Constraints: UNIQUE(template_id, name)
- Triggers: update_onboarding_template_tasks_updated_at -> update_updated_at_column()

3) offboarding_templates
- Purpose: Reusable offboarding plan templates.
- Key fields: Same pattern as onboarding_templates.
- Constraints: UNIQUE(tenant_id, name)
- Indexes: idx_offboarding_templates_tenant(tenant_id)
- Triggers: update_offboarding_templates_updated_at

4) offboarding_template_tasks
- Purpose: Task definitions within an offboarding template.
- Key fields: Similar to onboarding_template_tasks with relative_day_offset referencing last_working_day where applicable.
- Constraints: UNIQUE(template_id, name)
- Triggers: update_offboarding_template_tasks_updated_at

5) onboarding_cases
- Purpose: Instance of onboarding plan for a hire; links to recruitment and employee.
- Key fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - template_id UUID REFERENCES onboarding_templates(id) ON DELETE SET NULL
  - applicant_id UUID REFERENCES applicants(id) ON DELETE SET NULL
  - application_id UUID REFERENCES applications(id) ON DELETE SET NULL
  - offer_id UUID REFERENCES offers(id) ON DELETE SET NULL
  - employee_id UUID REFERENCES employees(id) ON DELETE SET NULL
  - start_date DATE NOT NULL DEFAULT CURRENT_DATE
  - target_completion_date DATE
  - status onboarding_status DEFAULT 'planned'
  - workflow_instance_id UUID (optional link to workflows)
  - metadata JSONB DEFAULT '{}'
  - created_by UUID REFERENCES users(id)
  - updated_by UUID REFERENCES users(id)
  - created_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ DEFAULT now()
  - deleted_at TIMESTAMPTZ (soft delete)
- Indexes
  - idx_onboarding_cases_tenant_status(tenant_id, status)
  - idx_onboarding_cases_dates(tenant_id, start_date, target_completion_date)
- Triggers
  - update_onboarding_cases_updated_at
  - trg_onboarding_case_tenant -> trg_validate_onboarding_case_tenant() for cross-tenant integrity

6) onboarding_case_tasks
- Purpose: Tasks instantiated for specific onboarding cases.
- Key fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - case_id UUID NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE
  - template_task_id UUID REFERENCES onboarding_template_tasks(id) ON DELETE SET NULL
  - name TEXT NOT NULL
  - description TEXT
  - status task_status DEFAULT 'pending'
  - priority priority_level DEFAULT 'normal'
  - assignee_user_id UUID REFERENCES users(id) ON DELETE SET NULL
  - assignee_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL
  - due_date DATE
  - completed_at TIMESTAMPTZ
  - blocked_reason TEXT
  - created_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ DEFAULT now()
  - deleted_at TIMESTAMPTZ (soft delete)
- Indexes
  - idx_onboarding_case_tasks_status(tenant_id, case_id, status)
  - idx_onboarding_case_tasks_due(tenant_id, due_date) WHERE deleted_at IS NULL
- Triggers
  - update_onboarding_case_tasks_updated_at
  - trg_onboarding_case_task_tenant -> trg_validate_case_task_tenant()

7) offboarding_cases
- Purpose: Instance of offboarding plan for a departing employee.
- Key fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - template_id UUID REFERENCES offboarding_templates(id) ON DELETE SET NULL
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - initiator_user_id UUID REFERENCES users(id) ON DELETE SET NULL
  - exit_type TEXT (resignation, termination, retirement, layoff, contract_end)
  - reason TEXT
  - last_working_day DATE NOT NULL
  - rehire_eligible BOOLEAN DEFAULT true
  - status offboarding_status DEFAULT 'planned'
  - workflow_instance_id UUID
  - metadata JSONB DEFAULT '{}'
  - created_by UUID REFERENCES users(id)
  - updated_by UUID REFERENCES users(id)
  - created_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ DEFAULT now()
  - deleted_at TIMESTAMPTZ (soft delete)
- Indexes
  - idx_offboarding_cases_tenant_status(tenant_id, status)
  - idx_offboarding_cases_last_day(tenant_id, last_working_day)
- Triggers
  - update_offboarding_cases_updated_at
  - trg_offboarding_case_tenant -> trg_validate_offboarding_case_tenant()

8) offboarding_case_tasks
- Purpose: Tasks instantiated for specific offboarding cases.
- Key fields: Similar to onboarding_case_tasks with FK to offboarding_cases.
- Indexes
  - idx_offboarding_case_tasks_status(tenant_id, case_id, status)
  - idx_offboarding_case_tasks_due(tenant_id, due_date) WHERE deleted_at IS NULL
- Triggers
  - update_offboarding_case_tasks_updated_at
  - trg_offboarding_case_task_tenant -> trg_validate_case_task_tenant()

9) provisioning_requests
- Purpose: Track access/hardware/software provisioning for onboarding/offboarding.
- Key fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - case_type case_type NOT NULL (onboarding/offboarding)
  - case_id UUID NOT NULL (polymorphic to case via case_type)
  - request_type TEXT NOT NULL (account, system_access, hardware, software, license, badge, email, vpn)
  - target_system TEXT
  - requested_for_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL
  - requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
  - status provision_status DEFAULT 'requested'
  - details JSONB DEFAULT '{}'
  - approved_by UUID REFERENCES users(id) ON DELETE SET NULL
  - approved_at TIMESTAMPTZ
  - provisioned_at TIMESTAMPTZ
  - revoked_at TIMESTAMPTZ
  - created_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ DEFAULT now()
- Indexes
  - idx_provisioning_requests_status(tenant_id, status)
  - idx_provisioning_requests_case(tenant_id, case_type, case_id)
- Triggers
  - update_provisioning_requests_updated_at
  - trg_provisioning_request_tenant -> trg_validate_provisioning_request_tenant()

10) asset_assignments
- Purpose: Track issued assets and returns, optionally linked to a case.
- Key fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - case_type case_type (optional)
  - case_id UUID (optional)
  - asset_type asset_type NOT NULL
  - asset_tag TEXT
  - serial_number TEXT
  - assigned_at TIMESTAMPTZ DEFAULT now()
  - due_return_at TIMESTAMPTZ
  - returned_at TIMESTAMPTZ
  - condition_on_return TEXT
  - metadata JSONB DEFAULT '{}'
  - created_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ DEFAULT now()
- Indexes
  - idx_asset_assignments_employee(tenant_id, employee_id)
  - idx_asset_assignments_return_pending(tenant_id) WHERE returned_at IS NULL
- Triggers
  - update_asset_assignments_updated_at
  - trg_asset_assignment_tenant -> trg_validate_asset_assignment_tenant()

11) exit_interviews
- Purpose: Schedule/store exit interview info for offboarding cases.
- Key fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - offboarding_case_id UUID NOT NULL REFERENCES offboarding_cases(id) ON DELETE CASCADE
  - scheduled_at TIMESTAMPTZ
  - interviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL
  - interviewer_notes TEXT
  - rating INT CHECK rating BETWEEN 1 AND 5 (nullable allowed)
  - completed_at TIMESTAMPTZ
  - created_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ DEFAULT now()
- Indexes: idx_exit_interviews_case(tenant_id, offboarding_case_id)
- Triggers: update_exit_interviews_updated_at

12) knowledge_transfer_records
- Purpose: Track knowledge transfer from departing to successor employees.
- Key fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - offboarding_case_id UUID NOT NULL REFERENCES offboarding_cases(id) ON DELETE CASCADE
  - from_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - to_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL
  - subject TEXT NOT NULL
  - due_date DATE
  - completed_at TIMESTAMPTZ
  - notes TEXT
  - created_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ DEFAULT now()
- Indexes: idx_kt_records_case(tenant_id, offboarding_case_id)
- Triggers: update_kt_records_updated_at

13) clearance_checklist_items
- Purpose: Departmental offboarding clearance checklist (HR, IT, Facilities, etc.).
- Key fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - offboarding_case_id UUID NOT NULL REFERENCES offboarding_cases(id) ON DELETE CASCADE
  - department_id UUID REFERENCES departments(id) ON DELETE SET NULL
  - item_name TEXT NOT NULL
  - status task_status DEFAULT 'pending'
  - due_date DATE
  - completed_at TIMESTAMPTZ
  - notes TEXT
  - created_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ DEFAULT now()
- Indexes: idx_clearance_items_case(tenant_id, offboarding_case_id)
- Triggers: update_clearance_items_updated_at

14) onboarding_notes
- Purpose: Case notes with visibility control for onboarding cases.
- Key fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - case_id UUID NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE
  - created_by UUID REFERENCES users(id) ON DELETE SET NULL
  - visibility note_visibility DEFAULT 'private'
  - body TEXT
  - created_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ DEFAULT now()
- Indexes: idx_onboarding_notes_case(tenant_id, case_id)
- Triggers: update_onboarding_notes_updated_at

15) offboarding_notes
- Purpose: Case notes with visibility control for offboarding cases.
- Key fields: Mirrors onboarding_notes with FK to offboarding_cases.
- Indexes: idx_offboarding_notes_case(tenant_id, case_id)
- Triggers: update_offboarding_notes_updated_at

Tenant Validation Triggers and Rules
- trg_validate_onboarding_case_tenant
  - Ensures applicant_id, application_id, offer_id, employee_id (if present) match NEW.tenant_id.
- trg_validate_offboarding_case_tenant
  - Ensures employee_id tenant matches NEW.tenant_id.
- trg_validate_case_task_tenant
  - Ensures onboarding_case_tasks and offboarding_case_tasks tenant_id equals their parent case tenant.
- trg_validate_provisioning_request_tenant
  - Ensures provisioning_requests tenant_id matches the tenant of referenced case (by case_type/case_id).
- trg_validate_asset_assignment_tenant
  - Ensures asset_assignments tenant_id matches the tenant of referenced employee.

Audit and Soft Delete Behavior
- updated_at triggers exist on all operational tables listed above.
- Soft delete via deleted_at on: onboarding_templates, onboarding_cases, onboarding_case_tasks, offboarding_templates, offboarding_cases, offboarding_case_tasks.
- Conditional indexes exclude deleted rows where useful (e.g., due-date task indexes).

Reporting Views
- onboarding_case_overview
  - Returns all onboarding_cases columns (oc.*)
  - Adds: applicant_name, employee_name, open_tasks (non-completed), completed_tasks (completed)
  - Joins: applicants (optional), employees (optional)
- offboarding_case_overview
  - Returns all offboarding_cases columns (oc.*)
  - Adds: employee_name, open_tasks (non-completed), completed_tasks (completed)
  - Joins: employees

Cross-Module Dependencies
- tenants(id): multitenancy anchor for tenant_id FKs.
- users(id): references for created_by, approvers, interviewers, assignees, initiators.
- employees(id): core HR employee linkage for cases, tasks, asset tracking, knowledge transfer.
- applicants(id), applications(id), offers(id): recruitment linkage for onboarding.
- departments(id): departmental clearance linkage.
- workflows.workflow_instances(id) (conceptual): optional linkage via workflow_instance_id (no direct FK in this schema).

Operational Notes
- Case instantiation
  - Create case (onboarding or offboarding) with appropriate template_id and linkage to employees/recruitment artifacts.
  - Tenant validation triggers enforce cross-module tenant consistency.
- Task generation
  - Tasks may be pre-seeded from template_*_tasks using relative_day_offset or created ad hoc.
  - Assignee can be user or employee; statuses reflect execution progress.
- Provisioning lifecycle
  - provisioning_requests track request -> approval -> provisioning -> revocation (as applicable) with status transitions and timestamps.
- Asset lifecycle
  - asset_assignments record issuance and returns; returned_at null indicates outstanding items.
- Exit process
  - exit_interviews, knowledge_transfer_records, and clearance_checklist_items support structured offboarding.
- Notes and visibility
  - onboarding_notes and offboarding_notes include visibility controls (private/team/public).

Indexes Summary (by table)
- onboarding_templates: idx_onboarding_templates_tenant
- offboarding_templates: idx_offboarding_templates_tenant
- onboarding_cases: idx_onboarding_cases_tenant_status, idx_onboarding_cases_dates
- offboarding_cases: idx_offboarding_cases_tenant_status, idx_offboarding_cases_last_day
- onboarding_case_tasks: idx_onboarding_case_tasks_status, idx_onboarding_case_tasks_due (partial)
- offboarding_case_tasks: idx_offboarding_case_tasks_status, idx_offboarding_case_tasks_due (partial)
- provisioning_requests: idx_provisioning_requests_status, idx_provisioning_requests_case
- asset_assignments: idx_asset_assignments_employee, idx_asset_assignments_return_pending (partial)
- exit_interviews: idx_exit_interviews_case
- knowledge_transfer_records: idx_kt_records_case
- clearance_checklist_items: idx_clearance_items_case
- onboarding_notes: idx_onboarding_notes_case
- offboarding_notes: idx_offboarding_notes_case

Security and Data Integrity
- FKs with ON DELETE CASCADE where safe (e.g., tenant-scoped roots, case/task containment) and ON DELETE SET NULL where referential preservation is desired.
- Tenant validation triggers block cross-tenant references to enforce isolation.
- CHECK constraint on exit_interviews.rating to maintain valid range.

Change Tracking
- All operational tables have created_at and updated_at; selected entities also have deleted_at for soft deletes.
- Uniform update_updated_at_column() trigger ensures updated_at accuracy.

Implementation Notes
- Ensure required referenced tables (tenants, users, employees, applicants, applications, offers, departments) are provisioned in the database.
- Enable uuid-ossp extension prior to creating tables to support uuid_generate_v4().
- Views provide aggregated task counts for quick dashboards and reporting.

End of documentation.