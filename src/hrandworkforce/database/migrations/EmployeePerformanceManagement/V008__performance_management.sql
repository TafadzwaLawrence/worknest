-- =====================
-- PERFORMANCE & DEVELOPMENT SCHEMA
-- Extends the existing HR & Workforce Management System
-- Design principles:
--   - Consistent multi-tenant architecture (tenant_id on all tables)
--   - Support for continuous performance management and formal reviews
--   - Goal setting and tracking (OKRs, SMART goals)
--   - Competency and skill management
--   - Learning management system integration
-- =====================

-- =====================
-- ENUMS / TYPE DEFINITIONS
-- =====================
-- Enable UUID extension (if not already enabled)
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

DO $$ BEGIN CREATE TYPE review_type AS ENUM ('annual', 'quarterly', 'probation', 'promotion', 'project', '360'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE review_status AS ENUM ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE rating_scale AS ENUM ('1-5', '1-10', 'percentage', 'text', 'custom'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE goal_status AS ENUM ('draft', 'active', 'on_track', 'at_risk', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE goal_type AS ENUM ('company', 'department', 'team', 'individual'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE goal_period AS ENUM ('annual', 'quarterly', 'monthly', 'custom'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE competency_level AS ENUM ('novice', 'basic', 'intermediate', 'advanced', 'expert'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE enrollment_status AS ENUM ('enrolled', 'in_progress', 'completed', 'passed', 'failed', 'dropped'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE content_type AS ENUM ('video', 'document', 'quiz', 'assignment', 'link', 'scorm'); EXCEPTION WHEN duplicate_object THEN null; END; $$;

-- =====================
-- PERFORMANCE MANAGEMENT
-- =====================

-- Performance review cycles
CREATE TABLE IF NOT EXISTS review_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    review_type review_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    due_date DATE,
    is_active BOOLEAN DEFAULT false,
    auto_reminder BOOLEAN DEFAULT true,
    reminder_days_before INT[] DEFAULT ARRAY[7, 3, 1],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

-- Performance review templates
CREATE TABLE IF NOT EXISTS review_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    review_type review_type NOT NULL,
    rating_scale rating_scale NOT NULL DEFAULT '1-5',
    questions JSONB NOT NULL, -- Array of question objects
    weightings JSONB, -- Section weightings
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

-- Individual performance reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id), -- Primary reviewer
    review_cycle_id UUID REFERENCES review_cycles(id) ON DELETE SET NULL,
    template_id UUID REFERENCES review_templates(id) ON DELETE SET NULL,
    review_type review_type NOT NULL,
    status review_status DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    due_date DATE,
    overall_rating NUMERIC(5,2),
    overall_comments TEXT,
    strengths TEXT,
    development_areas TEXT,
    recommendations JSONB,
    is_self_review BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Review participants (for 360 reviews)
CREATE TABLE IF NOT EXISTS review_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    review_id UUID NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL, -- 'manager', 'peer', 'direct_report', 'self', 'other'
    weight NUMERIC(5,2) DEFAULT 1.0,
    is_required BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    invited_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (review_id, participant_id)
);

-- Review responses
CREATE TABLE IF NOT EXISTS review_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    review_id UUID NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL, -- References template questions
    rating NUMERIC(5,2),
    comments TEXT,
    evidence JSONB, -- Links to goals, projects, etc.
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (review_id, participant_id, question_id)
);

-- =====================
-- GOAL MANAGEMENT
-- =====================

-- Goal templates (OKRs, SMART goals)
CREATE TABLE IF NOT EXISTS goal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    goal_type goal_type NOT NULL,
    category TEXT,
    default_metrics JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

-- Employee goals
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL, -- For cascading goals
    template_id UUID REFERENCES goal_templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    goal_type goal_type NOT NULL DEFAULT 'individual',
    category TEXT,
    period goal_period NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_value NUMERIC(12,2),
    current_value NUMERIC(12,2) DEFAULT 0,
    unit TEXT, -- 'percentage', 'dollars', 'units', etc.
    status goal_status DEFAULT 'draft',
    progress NUMERIC(5,2) DEFAULT 0, -- 0-100%
    weight NUMERIC(5,2) DEFAULT 1.0,
    is_private BOOLEAN DEFAULT false,
    key_results JSONB, -- For OKRs: [{description: "", target: 100, current: 0}]
    milestones JSONB, -- [{date: "", description: "", completed: false}]
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Goal alignment (linking goals to company objectives)
CREATE TABLE IF NOT EXISTS goal_alignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    aligned_goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    alignment_strength NUMERIC(5,2) DEFAULT 1.0, -- 0-1 scale
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (goal_id, aligned_goal_id)
);

-- Goal updates and progress tracking
CREATE TABLE IF NOT EXISTS goal_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    previous_value NUMERIC(12,2),
    new_value NUMERIC(12,2),
    progress_change NUMERIC(5,2),
    comments TEXT,
    challenges TEXT,
    support_needed TEXT,
    update_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- COMPETENCY & SKILL MANAGEMENT
-- =====================

-- Competency framework
CREATE TABLE IF NOT EXISTS competency_frameworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

-- Competencies
CREATE TABLE IF NOT EXISTS competencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    framework_id UUID NOT NULL REFERENCES competency_frameworks(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES competencies(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    weight NUMERIC(5,2) DEFAULT 1.0,
    behavioral_indicators JSONB, -- Indicators for each level
    is_core BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (framework_id, name)
);

-- Employee competencies
CREATE TABLE IF NOT EXISTS employee_competencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    current_level competency_level,
    target_level competency_level,
    self_assessment_date DATE,
    manager_assessment_date DATE,
    assessment_method TEXT, -- 'self', 'manager', '360', 'test'
    confidence_level NUMERIC(5,2), -- 0-100%
    evidence JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (employee_id, competency_id)
);

-- Skill inventory
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[],
    is_technical BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

-- Employee skills
CREATE TABLE IF NOT EXISTS employee_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INT CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    years_experience NUMERIC(4,1),
    last_used DATE,
    interest_level INT CHECK (interest_level >= 1 AND interest_level <= 5),
    is_certified BOOLEAN DEFAULT false,
    certification_date DATE,
    expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (employee_id, skill_id)
);

-- =====================
-- LEARNING MANAGEMENT SYSTEM (LMS)
-- =====================

/*
Table: courses
Use: Course catalog for the tenant's learning library.
Relationships: Referenced by course_modules, course_enrollments, learning_paths,
               development_plan_items. instructor_id → users.
*/
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    duration_hours NUMERIC(6,2),
    tags TEXT[] DEFAULT '{}',
    is_mandatory BOOLEAN DEFAULT false,
    status course_status DEFAULT 'draft',
    prerequisites JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    search_vector tsvector,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

/*
Table: course_modules
Use: Ordered subunits within a course.
Relationships: course_id → courses.
*/
CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 0,
    duration_minutes INT,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/*
Table: course_content
Use: Individual content items (video, document, quiz, etc.) within a module.
Relationships: module_id → course_modules.
*/
CREATE TABLE IF NOT EXISTS course_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type content_type NOT NULL,
    url TEXT,
    content JSONB DEFAULT '{}',
    order_index INT NOT NULL DEFAULT 0,
    duration_minutes INT,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/*
Table: course_enrollments
Use: Tracks an employee's enrolment and progress in a course.
Relationships: employee_id → employees, course_id → courses.
*/
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status enrollment_status DEFAULT 'enrolled',
    enrollment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    completion_percentage NUMERIC(5,2) DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    score NUMERIC(5,2),
    completed_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    enrolled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (employee_id, course_id)
);

/*
Table: learning_paths
Use: Curated, ordered sequences of courses targeting a skill or designation.
Relationships: target_designation_id → designations; courses stored as JSONB array of course UUIDs.
*/
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_designation_id UUID REFERENCES designations(id) ON DELETE SET NULL,
    courses JSONB NOT NULL DEFAULT '[]',
    estimated_hours NUMERIC(6,2),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

/*
Table: training_requests
Use: Employee-initiated requests for external or internal training / courses.
Relationships: employee_id → employees, reviewed_by → users.
*/
CREATE TABLE IF NOT EXISTS training_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    provider TEXT,
    description TEXT,
    justification TEXT,
    estimated_cost NUMERIC(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/*
Table: development_plans
Use: Individual development plans agreed between employee and manager.
Relationships: employee_id → employees, created_by → users.
*/
CREATE TABLE IF NOT EXISTS development_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CHECK (end_date > start_date)
);

/*
Table: development_plan_items
Use: Individual action items / activities within a development plan.
Relationships: plan_id → development_plans, course_id (optional) → courses.
*/
CREATE TABLE IF NOT EXISTS development_plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'training' CHECK (type IN ('training', 'mentoring', 'project', 'shadowing', 'reading', 'certification', 'other')),
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    completion_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- INDEXES
-- =====================

-- Performance reviews
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee ON performance_reviews (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_cycle ON performance_reviews (tenant_id, review_cycle_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_status ON performance_reviews (tenant_id, status);

-- Goals
CREATE INDEX IF NOT EXISTS idx_goals_employee ON goals (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_period ON goals (tenant_id, period);

-- Competencies
CREATE INDEX IF NOT EXISTS idx_employee_competencies ON employee_competencies (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills ON employee_skills (tenant_id, employee_id);

-- Learning
CREATE INDEX IF NOT EXISTS idx_courses_tenant ON courses (tenant_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses (tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_courses_search_vector ON courses USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules (course_id);
CREATE INDEX IF NOT EXISTS idx_course_content_module ON course_content (module_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_employee ON course_enrollments (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments (tenant_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_learning_paths_designation ON learning_paths (tenant_id, target_designation_id);
CREATE INDEX IF NOT EXISTS idx_training_requests_employee ON training_requests (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_training_requests_status ON training_requests (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_development_plans_employee ON development_plans (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_development_plan_items_plan ON development_plan_items (plan_id);

-- =====================
-- TRIGGERS & FUNCTIONS
-- =====================

-- Updated_at trigger for all tables
-- Explicit BEFORE UPDATE triggers using update_updated_at_column()
CREATE TRIGGER update_review_cycles_updated_at BEFORE UPDATE ON review_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_templates_updated_at BEFORE UPDATE ON review_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON performance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_participants_updated_at BEFORE UPDATE ON review_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_responses_updated_at BEFORE UPDATE ON review_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goal_templates_updated_at BEFORE UPDATE ON goal_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goal_alignments_updated_at BEFORE UPDATE ON goal_alignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goal_updates_updated_at BEFORE UPDATE ON goal_updates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competency_frameworks_updated_at BEFORE UPDATE ON competency_frameworks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competencies_updated_at BEFORE UPDATE ON competencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_competencies_updated_at BEFORE UPDATE ON employee_competencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_skills_updated_at BEFORE UPDATE ON employee_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Learning tables (now defined above)
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_modules_updated_at BEFORE UPDATE ON course_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_content_updated_at BEFORE UPDATE ON course_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON course_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_requests_updated_at BEFORE UPDATE ON training_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_development_plans_updated_at BEFORE UPDATE ON development_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_development_plan_items_updated_at BEFORE UPDATE ON development_plan_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tenant validation triggers
CREATE OR REPLACE FUNCTION trg_validate_performance_tenant() RETURNS trigger AS $$
DECLARE ref_tenant UUID;
BEGIN
    -- Validate employee references
    IF NEW.employee_id IS NOT NULL THEN
        ref_tenant := _get_tenant_id_for('employees', NEW.employee_id);
        IF ref_tenant IS NOT NULL AND ref_tenant != NEW.tenant_id THEN
            RAISE EXCEPTION 'Tenant mismatch in %: employee_id % belongs to tenant %', TG_TABLE_NAME, NEW.employee_id, ref_tenant;
        END IF;
    END IF;

    -- Validate review cycle references
    IF NEW.review_cycle_id IS NOT NULL THEN
        ref_tenant := _get_tenant_id_for('review_cycles', NEW.review_cycle_id);
        IF ref_tenant IS NOT NULL AND ref_tenant != NEW.tenant_id THEN
            RAISE EXCEPTION 'Tenant mismatch in %: review_cycle_id % belongs to tenant %', TG_TABLE_NAME, NEW.review_cycle_id, ref_tenant;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply tenant validation to performance tables
DROP TRIGGER IF EXISTS trg_validate_performance_tenant ON performance_reviews;
CREATE TRIGGER trg_validate_performance_tenant BEFORE INSERT OR UPDATE ON performance_reviews FOR EACH ROW EXECUTE PROCEDURE trg_validate_performance_tenant();

DROP TRIGGER IF EXISTS trg_validate_performance_tenant ON goals;
CREATE TRIGGER trg_validate_performance_tenant BEFORE INSERT OR UPDATE ON goals FOR EACH ROW EXECUTE PROCEDURE trg_validate_performance_tenant();

DROP TRIGGER IF EXISTS trg_validate_performance_tenant ON course_enrollments;
CREATE TRIGGER trg_validate_performance_tenant BEFORE INSERT OR UPDATE ON course_enrollments FOR EACH ROW EXECUTE PROCEDURE trg_validate_performance_tenant();

-- =====================
-- VIEWS FOR REPORTING
-- =====================

-- Employee development summary view
CREATE OR REPLACE VIEW employee_development_summary AS
SELECT 
    e.tenant_id,
    e.id AS employee_id,
    e.employee_code AS employee_number,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    (SELECT COUNT(*) FROM performance_reviews pr WHERE pr.employee_id = e.id AND pr.status = 'completed') AS completed_reviews,
    (SELECT COUNT(*) FROM goals g WHERE g.employee_id = e.id AND g.status = 'active') AS active_goals,
    (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.employee_id = e.id AND ce.status = 'completed') AS completed_courses,
    (SELECT COUNT(*) FROM employee_competencies ec WHERE ec.employee_id = e.id) AS competencies_assessed,
    (SELECT jsonb_agg(sub.obj)
     FROM (SELECT jsonb_build_object('skill', s.name, 'level', es.proficiency_level) AS obj
           FROM employee_skills es JOIN skills s ON es.skill_id = s.id 
           WHERE es.employee_id = e.id ORDER BY es.proficiency_level DESC LIMIT 5) sub) AS top_skills
FROM employees e
WHERE e.deleted_at IS NULL;

-- Goal progress dashboard view
CREATE OR REPLACE VIEW goal_progress_dashboard AS
SELECT 
    g.tenant_id,
    g.id AS goal_id,
    g.title,
    g.goal_type,
    g.period,
    g.status,
    g.progress,
    g.start_date,
    g.end_date,
    e.employee_code AS employee_code,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    d.name AS department_name,
    (SELECT COUNT(*) FROM goal_updates gu WHERE gu.goal_id = g.id) AS update_count,
    (SELECT MAX(update_date) FROM goal_updates gu WHERE gu.goal_id = g.id) AS last_updated
FROM goals g
JOIN employees e ON g.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
WHERE g.deleted_at IS NULL;

-- Learning completion report view
CREATE OR REPLACE VIEW learning_completion_report AS
SELECT 
    ce.tenant_id,
    c.title AS course_title,
    c.category,
    c.difficulty_level,
    e.employee_code AS employee_code,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    ce.status,
    ce.completion_percentage,
    ce.score,
    ce.completed_date,
    ce.enrollment_date,
    EXTRACT(DAY FROM (ce.completed_date - ce.enrollment_date)) AS days_to_complete
FROM course_enrollments ce
JOIN courses c ON ce.course_id = c.id
JOIN employees e ON ce.employee_id = e.id
WHERE c.deleted_at IS NULL AND e.deleted_at IS NULL;

-- =====================
-- FULL-TEXT SEARCH
-- =====================

-- Add search vectors for courses and goals
ALTER TABLE courses ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_courses_search_vector ON courses USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_goals_search_vector ON goals USING GIN (search_vector);

-- Course search vector update function
CREATE OR REPLACE FUNCTION trg_update_course_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        coalesce(NEW.title, '') || ' ' || 
        coalesce(NEW.description, '') || ' ' || 
        coalesce(NEW.category, '') || ' ' || 
        coalesce(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_course_search_vector ON courses;
CREATE TRIGGER trg_course_search_vector BEFORE INSERT OR UPDATE ON courses
FOR EACH ROW EXECUTE PROCEDURE trg_update_course_search_vector();

-- Goal search vector update function
CREATE OR REPLACE FUNCTION trg_update_goal_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        coalesce(NEW.title, '') || ' ' || 
        coalesce(NEW.description, '') || ' ' || 
        coalesce(NEW.category, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_goal_search_vector ON goals;
CREATE TRIGGER trg_goal_search_vector BEFORE INSERT OR UPDATE ON goals
FOR EACH ROW EXECUTE PROCEDURE trg_update_goal_search_vector();

-- End of Performance & Development schema

-- ====================================
-- ROW-LEVEL SECURITY (RLS)
-- ====================================
ALTER TABLE review_cycles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_participants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_templates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_alignments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_updates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_frameworks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_competencies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills        ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses                ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content         ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths         ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON review_cycles         USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON review_templates      USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON performance_reviews   USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON review_participants   USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON review_responses      USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON goal_templates        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON goals                 USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON goal_alignments       USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON goal_updates          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON competency_frameworks USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON competencies          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON employee_competencies USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON skills                USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON employee_skills       USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON courses               USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON course_modules        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON course_content        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON course_enrollments    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON learning_paths        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON training_requests     USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON development_plans     USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON development_plan_items USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

--