-- core_configuration_tables.sql (improved)
-- Created: 2024-01-15
-- Updated: 2025-09-08
-- Description: Core configuration tables for multi-tenant HR system (hardened constraints, citext, FKs, checks)

-- ====================================
-- EXTENSIONS
-- ====================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

-- ====================================
-- CORE ENUM TYPES
-- ====================================
CREATE TYPE employment_type AS ENUM (
    'full_time', 'part_time', 'contract', 'temporary', 'intern', 'freelance'
);

CREATE TYPE employment_status AS ENUM (
    'active', 'probation', 'suspended', 'leave_of_absence', 'terminated', 'resigned'
);

CREATE TYPE address_type AS ENUM (
    'home', 'work', 'billing', 'shipping', 'other'
);

CREATE TYPE contact_type AS ENUM (
    'primary', 'secondary', 'emergency', 'work', 'personal'
);

CREATE TYPE gender_type AS ENUM (
    'male', 'female', 'non_binary', 'prefer_not_to_say', 'other'
);

-- ====================================
-- TENANT MANAGEMENT
-- ====================================
/*
Table: tenants
Use: Defines a tenant (company) and global settings scoping multi-tenant boundaries.
Relationships: Referenced by most tenant-scoped tables via tenant_id (ON DELETE CASCADE).
Implementation: JSONB for address/settings; unique subdomain for routing; audit timestamps.
*/
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    legal_name VARCHAR(255),
    subdomain VARCHAR(255) NOT NULL UNIQUE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    country_code VARCHAR(2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    /* refactored language field */
    business_language VARCHAR(10) DEFAULT 'en',
    indiginous_language VARCHAR(10) DEFAULT 'en',
    fiscal_year_start DATE DEFAULT '2024-01-01',
    is_active BOOLEAN DEFAULT true,
    
    -- Contact Information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    cell_phone_number VARCHAR(50),
    website VARCHAR(255),
    
    -- Address Information
    address JSONB DEFAULT '{
        "street": "",
        "city": "",
        "state": "",
        "postalCode": "",
        "country": ""
    }',
    
    -- Configuration
    settings JSONB DEFAULT '{
        "dateFormat": "YYYY-MM-DD",
        "timeFormat": "24h",
        "weekStartDay": 1,
        "defaultPagination": 50,
        "autoApproveLeave": false,
        "requireAttendanceLocation": false,
        "enableBiometric": false,
        "enableMobileApp": true
    }',
    
    -- Compliance
    tax_id VARCHAR(100),
    vat_registration_number VARCHAR(100),
    bp_number VARCHAR(100),

    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE tenants IS 'Master table for multi-tenancy, contains all company configurations';
COMMENT ON COLUMN tenants.subdomain IS 'Unique subdomain for tenant URL routing';
COMMENT ON COLUMN tenants.settings IS 'Tenant-specific configuration settings';

-- ====================================
-- ORGANIZATION STRUCTURE
-- ====================================
/*
Table: departments
Use: Organizational units with hierarchical parent-child relationship.
Relationships: employees.department_id; self-referencing parent_department_id (nullable).
Implementation: Unique (tenant_id, code/name); optional department_head_id.
*/
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    cost_center VARCHAR(100),
    parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    hierarchy_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Manager Information
    department_head_id UUID, -- Will reference employees table after creation
    
    -- Metadata
    created_by UUID, -- Will reference users table
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(tenant_id, code),
    UNIQUE(tenant_id, name)
);

COMMENT ON TABLE departments IS 'Organizational departments with hierarchy support';
COMMENT ON COLUMN departments.parent_department_id IS 'Self-referencing for department hierarchy';

/*
Table: designations
Use: Job titles/positions, optionally carrying pay scale metadata.
Relationships: employees.designation_id (nullable).
Implementation: Unique (tenant_id, code/title); JSONB pay_scale.
*/
CREATE TABLE designations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    grade VARCHAR(50),
    description TEXT,
    pay_grade VARCHAR(50),
    pay_scale JSONB DEFAULT '{
        "minSalary": 0,
        "maxSalary": 0,
        "currency": "USD"
    }',
    job_description TEXT,
    requirements TEXT,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(tenant_id, code),
    UNIQUE(tenant_id, title)
);

COMMENT ON TABLE designations IS 'Job titles and positions with pay grade information';

/*
Table: work_locations
Use: Physical or virtual work sites with geocoordinates and contacts.
Relationships: employees.work_location_id (nullable); used by scheduling/attendance.
Implementation: Unique (tenant_id, code/name); JSONB address including coordinates.
*/
CREATE TABLE work_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(50) DEFAULT 'office' CHECK (type IN ('office', 'remote', 'hybrid', 'field', 'client_site')),
    address JSONB NOT NULL DEFAULT '{
        "street": "",
        "city": "",
        "state": "",
        "postalCode": "",
        "country": "",
        "coordinates": {"lat": 0, "lng": 0}
    }',
    timezone VARCHAR(50),
    contact_number VARCHAR(50),
    contact_cell_number VARCHAR(50),

    email VARCHAR(255),
    capacity INTEGER,
    facilities JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(tenant_id, code),
    UNIQUE(tenant_id, name)
);

COMMENT ON TABLE work_locations IS 'Physical work locations with contact information and facilities';

-- ====================================
-- EMPLOYEE CORE DATA
-- ====================================
/*
Table: employees
Use: Core person and employment master data used across modules.
Relationships: Links to departments/designations/work_locations; self refs for reporting lines.
Implementation: CITEXT emails; JSONB bank_account; temporal checks for dates; unique codes/emails per tenant.
*/
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Personal Information
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    employee_code VARCHAR(255) NOT NULL,
    email CITEXT NOT NULL,
    personal_email CITEXT,
    work_phone_number VARCHAR(50),
    personal_cell_number VARCHAR(50),
    date_of_birth DATE,
    gender gender_type,
    nationality VARCHAR(100),
    
    -- Employment Information
    date_of_join DATE NOT NULL,
    date_of_confirmation DATE,
    date_of_exit DATE,
    employment_type employment_type DEFAULT 'full_time',
    employment_status employment_status DEFAULT 'active',
    
    -- Organizational Structure
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation_id UUID REFERENCES designations(id) ON DELETE SET NULL,
    work_location_id UUID REFERENCES work_locations(id) ON DELETE SET NULL,
    reporting_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    matrix_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    
    -- Compensation
    base_salary DECIMAL(12,2),
    salary_currency VARCHAR(3) DEFAULT 'USD',
    pay_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (pay_frequency IN ('weekly', 'bi-weekly', 'monthly', 'semi-monthly')),
    bank_account JSONB -- SECURITY: PII — must be encrypted at application layer before storage
    DEFAULT '{
        "accountNumber": "",
        "bankName": "",
        "branch": "",
        "ifscCode": ""
    }',
    
    -- System Access
    system_user_id UUID, -- Will reference users table after both exist
    requires_system_access BOOLEAN DEFAULT false,
    
    -- Flags
    is_active BOOLEAN DEFAULT true,
    is_contractor BOOLEAN DEFAULT false,
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CHECK (date_of_confirmation IS NULL OR date_of_confirmation >= date_of_join),
    CHECK (date_of_exit IS NULL OR date_of_exit >= date_of_join),
    
    UNIQUE(tenant_id, employee_code),
    UNIQUE(tenant_id, email)
);

COMMENT ON TABLE employees IS 'Core employee information with personal and employment details';
COMMENT ON COLUMN employees.matrix_manager_id IS 'Additional matrix reporting structure';

-- ====================================
-- EMPLOYEE CONTACT DETAILS
-- ====================================
/*
Table: employee_addresses
Use: One or more addresses per employee, typed and optionally primary.
Relationships: FK to employees (ON DELETE CASCADE).
Implementation: JSONB address; partial unique index enforces single primary address.
*/
CREATE TABLE employee_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type address_type DEFAULT 'home',
    address JSONB NOT NULL DEFAULT '{
        "street": "",
        "city": "",
        "state": "",
        "postalCode": "",
        "country": ""
    }',
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE employee_addresses IS 'Multiple addresses for employees with type classification';

/*
Table: employee_contacts
Use: Contact methods (email/phone/etc.) per employee with type and channel.
Relationships: FK to employees (ON DELETE CASCADE).
Implementation: Partial unique index ensures a single primary contact per (type, channel).
*/
CREATE TABLE employee_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type contact_type DEFAULT 'primary',
    channel VARCHAR(50) CHECK (channel IN ('phone', 'email', 'whatsapp', 'skype', 'other')),
    value VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE employee_contacts IS 'Multiple contact methods for employees';

/*
Table: emergency_contacts
Use: Emergency contacts for employees with relationship and priority.
Relationships: FK to employees (ON DELETE CASCADE).
Implementation: Partial unique index enforces at most one primary emergency contact.
*/
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address JSONB,
    is_primary BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE emergency_contacts IS 'Emergency contact information for employees';

-- ====================================
-- SYSTEM USERS & AUTHENTICATION
-- ====================================
/*
Table: users
Use: Authentication principal with preferences and security settings.
Relationships: Optional 1:1 to employees; referenced by audit/event logs as actor.
Implementation: CITEXT for case-insensitive username/email; JSONB preferences.
*/
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username CITEXT NOT NULL UNIQUE,
    email CITEXT NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_super_admin BOOLEAN DEFAULT false,
    
    -- Personalization
    preferences JSONB DEFAULT '{
        "language": "en",
        "timezone": "UTC",
        "dateFormat": "YYYY-MM-DD",
        "notifications": {
            "email": true,
            "push": true,
            "sms": false
        }
    }',
    
    -- Security
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(100),
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID UNIQUE REFERENCES employees(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE users IS 'System users for authentication and authorization';

/*
Table: roles
Use: Role definitions and permissions per tenant.
Relationships: Linked to users via user_roles.
Implementation: JSONB permissions; unique (tenant_id, code).
*/
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

COMMENT ON TABLE roles IS 'System roles with permission sets';

/*
Table: user_roles
Use: Many-to-many mapping from users to roles within a tenant.
Relationships: FKs to users and roles; denormalized assigned_by for audit.
*/
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, role_id)
);

COMMENT ON TABLE user_roles IS 'Mapping of users to roles';

-- ====================================
-- AUDIT & LOGGING
-- ====================================
/*
Table: audit_logs
Use: Immutable audit trail capturing who/when/what with before/after payloads.
Relationships: Optional actor (users), tenant scoping, and target entity info.
Implementation: Append-only; index on created_at, event, and entity refs for queries.
*/
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    
    -- Actor Information
    user_id UUID REFERENCES users(id),
    user_ip VARCHAR(45),
    user_agent TEXT,
    
    -- Target Information
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(100),
    entity_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE audit_logs IS 'Audit trail for all significant system events';

/*
Table: system_logs
Use: Application logs with contextual JSON for observability and debugging.
Relationships: Optional tenant and user context.
Implementation: Consider time/tenant partitioning at scale.
*/
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    context JSONB,
    module VARCHAR(100),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_logs IS 'System application logs for debugging and monitoring';

-- ====================================
-- INDEXES FOR CORE TABLES
-- ====================================

-- Tenant indexes
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);

-- Department indexes
CREATE INDEX idx_departments_tenant ON departments(tenant_id);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);
CREATE INDEX idx_departments_active ON departments(is_active) WHERE is_active = true;

-- Designation indexes
CREATE INDEX idx_designations_tenant ON designations(tenant_id);
CREATE INDEX idx_designations_active ON designations(is_active) WHERE is_active = true;

-- Work Location indexes
CREATE INDEX idx_work_locations_tenant ON work_locations(tenant_id);
CREATE INDEX idx_work_locations_active ON work_locations(is_active) WHERE is_active = true;

-- Employee indexes
CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_designation ON employees(designation_id);
CREATE INDEX idx_employees_location ON employees(work_location_id);
CREATE INDEX idx_employees_reporting ON employees(reporting_to);
CREATE INDEX idx_employees_status ON employees(employment_status);
CREATE INDEX idx_employees_active ON employees(is_active) WHERE is_active = true;
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_code ON employees(employee_code);

-- User indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_employee ON users(employee_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Role indexes
CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_roles_code ON roles(code);

-- Audit log indexes
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Partial unique indexes for primary flags
CREATE UNIQUE INDEX uq_employee_primary_address ON employee_addresses(employee_id, type) WHERE is_primary = true;
CREATE UNIQUE INDEX uq_employee_primary_contact ON employee_contacts(employee_id, type, channel) WHERE is_primary = true;
CREATE UNIQUE INDEX uq_employee_primary_emergency_contact ON emergency_contacts(employee_id) WHERE is_primary = true;

-- ====================================
-- FUNCTIONS & TRIGGERS
-- ====================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all core tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_designations_updated_at BEFORE UPDATE ON designations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_locations_updated_at BEFORE UPDATE ON work_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate employee code
CREATE OR REPLACE FUNCTION generate_employee_code()
RETURNS TRIGGER AS $$
DECLARE
    tenant_code VARCHAR(10);
    year_code VARCHAR(4);
    sequence_num INTEGER;
    new_employee_code VARCHAR(255);
BEGIN
    -- Get tenant code (first 3 letters of tenant name)
    SELECT UPPER(SUBSTRING(name FROM 1 FOR 3)) INTO tenant_code 
    FROM tenants WHERE id = NEW.tenant_id;
    
    -- Get current year
    year_code := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Get next sequence number for this tenant and year
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code FROM '[0-9]+$') AS INTEGER)), 0) + 1 
    INTO sequence_num 
    FROM employees 
    WHERE tenant_id = NEW.tenant_id 
    AND employee_code LIKE tenant_code || year_code || '%';
    
    -- Format the employee code
    new_employee_code := tenant_code || year_code || LPAD(sequence_num::VARCHAR, 4, '0');
    
    -- Set the employee code
    NEW.employee_code := new_employee_code;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to generate employee code before insert
CREATE TRIGGER generate_employee_code_trigger
BEFORE INSERT ON employees
FOR EACH ROW
WHEN (NEW.employee_code IS NULL)
EXECUTE FUNCTION generate_employee_code();

-- Function to update department head reference
CREATE OR REPLACE FUNCTION update_department_head()
RETURNS TRIGGER AS $$
BEGIN
    -- If department head is set in employees table, update departments table
    IF NEW.department_id IS NOT NULL AND NEW.reporting_to IS NULL THEN
        UPDATE departments 
        SET department_head_id = NEW.id 
        WHERE id = NEW.department_id 
        AND department_head_id IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_department_head_trigger
AFTER INSERT ON employees
FOR EACH ROW
EXECUTE FUNCTION update_department_head();

-- Hook up FKs that require tables to exist
ALTER TABLE employees
    ADD CONSTRAINT fk_employees_system_user_id FOREIGN KEY (system_user_id)
    REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE departments
    ADD CONSTRAINT fk_departments_department_head FOREIGN KEY (department_head_id)
    REFERENCES employees(id) ON DELETE SET NULL;

-- ====================================
-- INITIAL DATA (Optional)
-- ====================================

-- Insert default system roles
INSERT INTO roles (name, code, description, permissions, is_system_role, is_active, tenant_id) 
SELECT 
    'System Administrator', 
    'SYS_ADMIN', 
    'Full system access with all permissions', 
    '["*"]'::JSONB, 
    true, 
    true, 
    id
FROM tenants
ON CONFLICT DO NOTHING;

INSERT INTO roles (name, code, description, permissions, is_system_role, is_active, tenant_id) 
SELECT 
    'HR Manager', 
    'HR_MANAGER', 
    'HR management access', 
    '["employees:read", "employees:write", "employees:delete", "reports:read"]'::JSONB, 
    false, 
    true, 
    id
FROM tenants
ON CONFLICT DO NOTHING;

INSERT INTO roles (name, code, description, permissions, is_system_role, is_active, tenant_id) 
SELECT 
    'Employee', 
    'EMPLOYEE', 
    'Basic employee access', 
    '["profile:read", "profile:write", "attendance:read", "leave:read"]'::JSONB, 
    false, 
    true, 
    id
FROM tenants
ON CONFLICT DO NOTHING;

-- ====================================
-- ROW-LEVEL SECURITY (RLS)
-- ====================================
-- app.current_tenant_id must be SET at session start by the application layer:
--   SET LOCAL app.current_tenant_id = '<tenant-uuid>';
-- The missing_ok flag (true) returns NULL instead of erroring when unset,
-- which allows super-user / migration sessions to bypass RLS.

-- tenants: NOT restricted by RLS (it is the root isolation anchor)
-- Super-admins query tenants directly; app code scopes by subdomain login.

ALTER TABLE departments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_locations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees              ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_addresses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs            ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON departments        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON designations       USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON work_locations     USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON employees          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON users              USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON roles              USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON user_roles         USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON audit_logs         USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON system_logs        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- employee_addresses / employee_contacts / emergency_contacts lack tenant_id; they are
-- protected transitively via the employees FK — no direct RLS needed.

