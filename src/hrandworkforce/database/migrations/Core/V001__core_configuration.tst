Title: Core Configuration Tables Schema – Documentation

Scope
- Domain: Foundational multi-tenant configuration for the HR system.
- Purpose: Defines tenants, org structure, core employee master data, users/roles, and auditing.
- Multitenancy: Tenanted via tenant_id on scoped tables; core roots like tenants exist globally and are referenced widely.
- Governance: Audit timestamps (created_at, updated_at, deleted_at where applicable); uniform updated_at triggers; hardened constraints and indexes.

Database Extensions
- uuid-ossp: UUID generation via uuid_generate_v4().
- citext: Case-insensitive text for usernames/emails.

Core Enumerated Types
- employment_type: full_time, part_time, contract, temporary, intern, freelance
- employment_status: active, probation, suspended, leave_of_absence, terminated, resigned
- address_type: home, work, billing, shipping, other
- contact_type: primary, secondary, emergency, work, personal
- gender_type: male, female, non_binary, prefer_not_to_say, other

Tables and Structures
1) tenants
- Purpose: Tenant (company) master with contact, address, settings, and compliance metadata.
- Key columns
  - id UUID PK DEFAULT uuid_generate_v4()
  - name VARCHAR(255) NOT NULL UNIQUE
  - legal_name VARCHAR(255)
  - subdomain VARCHAR(255) NOT NULL UNIQUE
  - timezone VARCHAR(50) DEFAULT 'UTC'
  - country_code VARCHAR(2) NOT NULL
  - currency VARCHAR(3) DEFAULT 'USD'
  - language VARCHAR(10) DEFAULT 'en'
  - fiscal_year_start DATE DEFAULT '2024-01-01'
  - is_active BOOLEAN DEFAULT true
  - contact_email, contact_phone, website
  - address JSONB (default structure with city/country/postalCode/etc.)
  - settings JSONB (date/time formats, weekStartDay, defaultPagination, etc.)
  - tax_id, registration_number
  - created_at, updated_at, deleted_at
- Indexes: idx_tenants_subdomain(subdomain), idx_tenants_is_active(is_active)
- Comments: present on table and specific columns
- Triggers: update_tenants_updated_at

2) departments
- Purpose: Organizational units with hierarchical parent-child.
- Key columns
  - id UUID PK
  - name, code (UNIQUE per tenant)
  - description, cost_center, hierarchy_level INT DEFAULT 1, is_active BOOLEAN DEFAULT true
  - parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - department_head_id UUID (FK added later to employees)
  - created_by UUID (users), created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, code), UNIQUE(tenant_id, name)
- Indexes: idx_departments_tenant, idx_departments_parent, idx_departments_active (partial)
- Triggers: update_departments_updated_at

3) designations
- Purpose: Job titles/positions, with pay scale metadata.
- Key columns
  - id UUID PK
  - title, code (UNIQUE per tenant), grade, pay_grade, description
  - pay_scale JSONB (minSalary, maxSalary, currency)
  - job_description, requirements
  - is_active BOOLEAN DEFAULT true
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, code), UNIQUE(tenant_id, title)
- Indexes: idx_designations_tenant, idx_designations_active (partial)
- Triggers: update_designations_updated_at

4) work_locations
- Purpose: Work sites (office/remote/hybrid/field/client_site) with address and contacts.
- Key columns
  - id UUID PK
  - name, code (UNIQUE per tenant)
  - type VARCHAR(50) CHECK IN ('office','remote','hybrid','field','client_site')
  - address JSONB (street/city/state/postalCode/country + coordinates)
  - timezone, contact_number, email, capacity, facilities JSONB
  - is_active BOOLEAN DEFAULT true
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, code), UNIQUE(tenant_id, name)
- Indexes: idx_work_locations_tenant, idx_work_locations_active (partial)
- Triggers: update_work_locations_updated_at

5) employees
- Purpose: Core employee master data used across modules.
- Key columns
  - id UUID PK
  - first_name, last_name, display_name
  - employee_code VARCHAR(255) NOT NULL (UNIQUE per tenant)
  - email CITEXT NOT NULL (UNIQUE per tenant), personal_email CITEXT, phone
  - date_of_birth DATE, gender gender_type, nationality
  - date_of_join DATE NOT NULL, date_of_confirmation, date_of_exit
  - employment_type employment_type DEFAULT 'full_time'
  - employment_status employment_status DEFAULT 'active'
  - department_id, designation_id, work_location_id (FKs to respective tables ON DELETE SET NULL)
  - reporting_to, matrix_manager_id (self-referential)
  - base_salary DECIMAL(12,2), salary_currency VARCHAR(3) DEFAULT 'USD'
  - pay_frequency VARCHAR(20) DEFAULT 'monthly' CHECK IN ('weekly','bi-weekly','monthly','semi-monthly')
  - bank_account JSONB (accountNumber/bankName/branch/ifscCode)
  - system_user_id UUID (FK added later to users)
  - requires_system_access BOOLEAN DEFAULT false
  - is_active BOOLEAN DEFAULT true, is_contractor BOOLEAN DEFAULT false
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - created_at, updated_at, deleted_at
- Checks: confirmation >= join; exit >= join
- Constraints: UNIQUE(tenant_id, employee_code), UNIQUE(tenant_id, email)
- Indexes: idx_employees_tenant, department/designation/location/reporting/status, active (partial), email, code
- Triggers: update_employees_updated_at; generate_employee_code_trigger (BEFORE INSERT when employee_code is null)

6) employee_addresses
- Purpose: Multiple addresses per employee (typed), optionally one primary.
- Key columns
  - id UUID PK
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - type address_type DEFAULT 'home'
  - address JSONB (street/city/state/postalCode/country)
  - is_primary BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true
  - created_at, updated_at
- Indexes: uq_employee_primary_address (UNIQUE partial on employee_id,type WHERE is_primary = true)

7) employee_contacts
- Purpose: Contact methods per employee (email/phone/etc.).
- Key columns
  - id UUID PK
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - type contact_type DEFAULT 'primary'
  - channel VARCHAR(50) CHECK IN ('phone','email','whatsapp','skype','other')
  - value VARCHAR(255) NOT NULL
  - is_primary BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true
  - created_at, updated_at
- Indexes: uq_employee_primary_contact (UNIQUE partial on employee_id,type,channel WHERE is_primary = true)

8) emergency_contacts
- Purpose: Emergency contacts with relationship and priority.
- Key columns
  - id UUID PK
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - name VARCHAR(255) NOT NULL
  - relationship VARCHAR(100) NOT NULL
  - phone VARCHAR(50) NOT NULL, email VARCHAR(255)
  - address JSONB, is_primary BOOLEAN DEFAULT false, priority INT DEFAULT 1
  - created_at, updated_at
- Indexes: uq_employee_primary_emergency_contact (UNIQUE partial on employee_id WHERE is_primary = true)

9) users
- Purpose: Authentication principals with preferences and security.
- Key columns
  - id UUID PK
  - username CITEXT NOT NULL UNIQUE, email CITEXT NOT NULL UNIQUE
  - password_hash VARCHAR(255) NOT NULL
  - is_email_verified, is_active, is_super_admin
  - preferences JSONB (language, timezone, dateFormat, notifications)
  - mfa_enabled, mfa_secret, last_login_at, failed_login_attempts, locked_until
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - employee_id UUID UNIQUE REFERENCES employees(id)
  - created_at, updated_at, deleted_at
- Indexes: idx_users_tenant, idx_users_employee, idx_users_email, idx_users_active (partial)
- Triggers: update_users_updated_at

10) roles
- Purpose: Role definitions and permissions per tenant.
- Key columns
  - id UUID PK
  - name VARCHAR(255) NOT NULL, code VARCHAR(100) NOT NULL (UNIQUE per tenant)
  - description TEXT
  - permissions JSONB NOT NULL DEFAULT '[]'
  - is_system_role BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - created_at, updated_at
- Constraints: UNIQUE(tenant_id, code)
- Indexes: idx_roles_tenant, idx_roles_code
- Triggers: update_roles_updated_at

11) user_roles
- Purpose: Many-to-many mapping from users to roles.
- Key columns
  - id UUID PK
  - user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  - role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE
  - assigned_by UUID REFERENCES users(id)
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - created_at
- Constraints: UNIQUE(user_id, role_id)

12) audit_logs
- Purpose: Immutable audit trail of events with actor/target context.
- Key columns
  - id UUID PK
  - event_type, event_name, description
  - old_values JSONB, new_values JSONB
  - user_id UUID REFERENCES users(id)
  - user_ip, user_agent
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - entity_type VARCHAR(100), entity_id UUID
  - created_at
- Indexes: idx_audit_logs_tenant, idx_audit_logs_event_type, idx_audit_logs_created_at, idx_audit_logs_entity

13) system_logs
- Purpose: Application logs with contextual JSON.
- Key columns
  - id UUID PK
  - level VARCHAR(20) CHECK IN ('debug','info','warn','error','fatal')
  - message TEXT NOT NULL
  - context JSONB, module VARCHAR(100)
  - tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE
  - user_id UUID REFERENCES users(id)
  - created_at

Functions & Triggers
- update_updated_at_column(): Sets NEW.updated_at to CURRENT_TIMESTAMP on updates.
  - Applied to: tenants, departments, designations, work_locations, employees, users, roles.
- generate_employee_code(): BEFORE INSERT trigger function on employees to auto-generate employee_code per tenant-year sequence when employee_code is NULL.
  - generate_employee_code_trigger: attaches to employees.
- update_department_head(): AFTER INSERT on employees; if department_id is set and reporting_to is NULL, update departments.department_head_id where null.
  - update_department_head_trigger: attaches to employees.
- FK additions (post-create):
  - employees.system_user_id -> users(id) ON DELETE SET NULL
  - departments.department_head_id -> employees(id) ON DELETE SET NULL

Indexes Summary
- Tenants: idx_tenants_subdomain, idx_tenants_is_active
- Departments: idx_departments_tenant, idx_departments_parent, idx_departments_active (partial)
- Designations: idx_designations_tenant, idx_designations_active (partial)
- Work locations: idx_work_locations_tenant, idx_work_locations_active (partial)
- Employees: tenant/department/designation/location/reporting/status/active(partial)/email/code
- Users: tenant/employee/email/active(partial)
- Roles: tenant, code
- Audit logs: tenant, event_type, created_at, entity
- Partial unique indexes: uq_employee_primary_address; uq_employee_primary_contact; uq_employee_primary_emergency_contact

Operational Notes
- Soft deletes via deleted_at on select tables (tenants, departments, designations, work_locations, employees, users).
- JSONB fields (addresses, settings, preferences, pay_scale) allow flexible configuration.
- CITEXT ensures case-insensitive uniqueness for usernames/emails.
- Multi-tenant integrity is anchored via tenant_id and ON DELETE CASCADE from tenants on dependent tables.

Initial Data
- Seed roles per tenant: System Administrator (SYS_ADMIN), HR Manager (HR_MANAGER), Employee (EMPLOYEE). Inserts are idempotent via ON CONFLICT DO NOTHING.

Cross-Module Touchpoints
- employees is referenced by numerous downstream modules (recruitment, payroll, attendance, onboarding, etc.).
- users participates in authentication and is linked 1:1 optionally to employees.

End of documentation.