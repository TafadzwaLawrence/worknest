-- =====================
-- EMPLOYEE ENGAGEMENT SCHEMA
-- Extends the existing HR & Workforce Management System
-- Design principles:
--   - Multi-tenant architecture with tenant isolation
--   - Support for surveys, feedback, recognition, and pulse checks
--   - Integration with performance and workflow systems
--   - Real-time analytics and sentiment analysis
--   - Anonymous and confidential feedback options
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

DO $$ BEGIN CREATE TYPE survey_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE survey_type AS ENUM ('engagement', 'pulse', 'onboarding', 'exit', 'custom'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE question_type AS ENUM ('multiple_choice', 'rating_scale', 'text', 'likert', 'ranking', 'matrix'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE recognition_type AS ENUM ('peer_to_peer', 'manager_to_employee', 'team', 'company_wide', 'milestone'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE feedback_visibility AS ENUM ('public', 'private', 'anonymous', 'confidential'); EXCEPTION WHEN duplicate_object THEN null; END; $$;
DO $$ BEGIN CREATE TYPE sentiment_score AS ENUM ('very_negative', 'negative', 'neutral', 'positive', 'very_positive'); EXCEPTION WHEN duplicate_object THEN null; END; $$;

-- =====================
-- SURVEY MANAGEMENT
-- =====================

-- Survey templates and campaigns
/*
Table: engagement_surveys
Use: Defines survey campaigns (engagement/pulse/onboarding/exit/custom) with lifecycle and anonymity flags.
Relationships: survey_questions, survey_responses, survey_participation reference surveys.
Implementation: reminder_settings/participation_goal for campaign operations.
*/
CREATE TABLE IF NOT EXISTS engagement_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    survey_type survey_type NOT NULL DEFAULT 'engagement',
    frequency TEXT, -- 'once', 'quarterly', 'monthly', 'weekly'
    status survey_status DEFAULT 'draft',
    is_anonymous BOOLEAN DEFAULT true,
    is_confidential BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    reminder_settings JSONB, -- {enabled: true, frequency: 'weekly', max_reminders: 3}
    participation_goal NUMERIC(5,2) DEFAULT 80, -- Percentage goal
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, title)
);

-- Survey questions
/*
Table: survey_questions
Use: Stores per-survey questions with type, options, weights, and ordering.
Relationships: references engagement_surveys; responses reference questions.
*/
CREATE TABLE IF NOT EXISTS survey_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES engagement_surveys(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    position INT NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    options JSONB, -- For multiple choice, rating scales, etc.
    weight NUMERIC(5,2) DEFAULT 1.0,
    category TEXT,
    benchmark_value NUMERIC(5,2), -- Industry benchmark for comparison
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Survey responses
/*
Table: survey_responses
Use: Captures responses for each (survey, employee, question) with optional sentiment and numeric values.
Relationships: references engagement_surveys, survey_questions, employees.
Implementation: unique per (tenant, survey, employee, question); submitted_at timestamp.
*/
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES engagement_surveys(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    response_value TEXT, -- For text responses
    numeric_value NUMERIC(10,2), -- For rating scales
    selected_options JSONB, -- For multiple selections
    sentiment sentiment_score,
    response_time_seconds INT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, survey_id, employee_id, question_id)
);

-- Survey participation tracking
/*
Table: survey_participation
Use: Tracks invitation, start, completion, and reminders per employee per survey.
Relationships: references engagement_surveys and employees.
*/
CREATE TABLE IF NOT EXISTS survey_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES engagement_surveys(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_reminder_sent TIMESTAMPTZ,
    reminder_count INT DEFAULT 0,
    status TEXT DEFAULT 'invited', -- 'invited', 'started', 'completed', 'declined'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, survey_id, employee_id)
);

-- =====================
-- RECOGNITION & REWARDS
-- =====================

-- Recognition programs
/*
Table: recognition_programs
Use: Defines recognition program types, points, workflow link, budget, and active window.
Relationships: recognitions reference programs.
*/
CREATE TABLE IF NOT EXISTS recognition_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    recognition_type recognition_type NOT NULL,
    points_value INT DEFAULT 0,
    approval_required BOOLEAN DEFAULT false,
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    budget NUMERIC(12,2),
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

-- Recognition awards
/*
Table: recognitions
Use: Recognition awards between employees with status, visibility, points, and timestamps.
Relationships: giver/receiver employees; recognition_programs; tags and attachments extend metadata.
*/
CREATE TABLE IF NOT EXISTS recognitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    program_id UUID REFERENCES recognition_programs(id) ON DELETE SET NULL,
    giver_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    recognition_type recognition_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    points_awarded INT DEFAULT 0,
    visibility feedback_visibility DEFAULT 'public',
    is_anonymous BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'awarded'
    approved_by UUID REFERENCES users(id),
 approved_at TIMESTAMPTZ,
    awarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Recognition tags and values
/*
Table: recognition_tags
Use: Key-value classification for recognitions (e.g., values aligned to company values).
Relationships: references recognitions.
*/
CREATE TABLE IF NOT EXISTS recognition_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    recognition_id UUID NOT NULL REFERENCES recognitions(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, recognition_id, tag)
);

-- Employee points balance
/*
Table: employee_points
Use: Points balance per employee (earned/available/redeemed) for rewards.
Relationships: updated by triggers when recognitions are awarded; ledger kept elsewhere.
*/
CREATE TABLE IF NOT EXISTS employee_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    total_points_earned INT DEFAULT 0,
    points_available INT DEFAULT 0,
    points_redeemed INT DEFAULT 0,
    last_earned_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, employee_id)
);

-- Rewards catalog
/*
Table: rewards_catalog
Use: Rewards catalog items with points cost, category, inventory, availability window.
*/
CREATE TABLE IF NOT EXISTS rewards_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    points_cost INT NOT NULL,
    category TEXT,
    inventory_count INT,
    max_per_employee INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

-- Reward redemptions
/*
Table: reward_redemptions
Use: Records redemption requests and fulfillment with points used and status.
Relationships: employees and rewards_catalog.
*/
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards_catalog(id) ON DELETE CASCADE,
    points_used INT NOT NULL,
    status TEXT DEFAULT 'requested', -- 'requested', 'approved', 'fulfilled', 'cancelled'
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    fulfilled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- FEEDBACK & SUGGESTIONS
-- =====================

-- Feedback channels
/*
Table: feedback_channels
Use: Feedback intake channels with moderation and anonymity options.
*/
CREATE TABLE IF NOT EXISTS feedback_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'general', 'improvement', 'innovation', 'compliment'
    is_active BOOLEAN DEFAULT true,
    moderation_required BOOLEAN DEFAULT true,
    anonymity_allowed BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

-- Employee feedback
/*
Table: employee_feedback
Use: Employee-submitted feedback items (title/content/sentiment/visibility/status/priority).
Relationships: channels; authors; comments/votes/actions reference feedback items.
*/
CREATE TABLE IF NOT EXISTS employee_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES feedback_channels(id) ON DELETE CASCADE,
    author_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    sentiment sentiment_score,
    visibility feedback_visibility DEFAULT 'public',
    is_anonymous BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'submitted', -- 'submitted', 'under_review', 'acknowledged', 'implemented', 'rejected'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Feedback comments and discussions
/*
Table: feedback_comments
Use: Comments/discussions on feedback; supports sentiment and anonymity.
Relationships: references employee_feedback and employees.
*/
CREATE TABLE IF NOT EXISTS feedback_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feedback_id UUID NOT NULL REFERENCES employee_feedback(id) ON DELETE CASCADE,
    author_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    sentiment sentiment_score,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Feedback votes
/*
Table: feedback_votes
Use: Voting per employee per feedback (upvote/downvote) for prioritization.
*/
CREATE TABLE IF NOT EXISTS feedback_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feedback_id UUID NOT NULL REFERENCES employee_feedback(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL, -- 'upvote', 'downvote'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, feedback_id, employee_id)
);

-- Feedback action items
/*
Table: feedback_actions
Use: Action items derived from feedback with assignment and due/status tracking.
*/
CREATE TABLE IF NOT EXISTS feedback_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feedback_id UUID NOT NULL REFERENCES employee_feedback(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    action_text TEXT NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- PULSE CHECKS & MOOD TRACKING
-- =====================

-- Pulse check questions
/*
Table: pulse_questions
Use: Pulse question bank with type, scale, category, and frequency.
*/
CREATE TABLE IF NOT EXISTS pulse_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type DEFAULT 'rating_scale',
    scale_min INT DEFAULT 1,
    scale_max INT DEFAULT 5,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    frequency TEXT, -- 'daily', 'weekly', 'monthly'
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Pulse responses
/*
Table: pulse_responses
Use: Daily/periodic pulse responses per employee per question with sentiment.
*/
CREATE TABLE IF NOT EXISTS pulse_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES pulse_questions(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    response_value NUMERIC(5,2),
    sentiment sentiment_score,
    comments TEXT,
    response_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, question_id, employee_id, response_date)
);

-- Mood tracking
/*
Table: mood_tracking
Use: Employee mood entries with score, emoji, factors, and comments on a date.
*/
CREATE TABLE IF NOT EXISTS mood_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    mood_score INT NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
    mood_emoji TEXT,
    factors JSONB, -- {workload: 3, work_life_balance: 4, team_collaboration: 5}
    comments TEXT,
    track_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, employee_id, track_date)
);

-- =====================
-- ENGAGEMENT ANALYTICS
-- =====================

-- Engagement scores
/*
Table: engagement_scores
Use: Computed per-employee engagement score and category breakdowns per day.
*/
CREATE TABLE IF NOT EXISTS engagement_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    overall_score NUMERIC(5,2),
    category_scores JSONB, -- {work_environment: 4.2, growth_opportunities: 3.8, recognition: 4.5}
    benchmark_comparison NUMERIC(5,2),
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, employee_id, calculation_date)
);

-- Department/Team engagement metrics
/*
Table: team_engagement_metrics
Use: Aggregated metrics per team/department per metric_date (engagement, eNPS, participation, turnover).
*/
CREATE TABLE IF NOT EXISTS team_engagement_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    department_id UUID, -- References external departments table
    team_id UUID, -- References external teams table
    engagement_score NUMERIC(5,2),
    participation_rate NUMERIC(5,2),
    eNPS NUMERIC(5,2), -- Employee Net Promoter Score
    turnover_rate NUMERIC(5,2),
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_engagement_metrics ON team_engagement_metrics (tenant_id, COALESCE(department_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::uuid), metric_date);

-- Trend analysis
/*
Table: engagement_trends
Use: Time-bucketed insights and direction (improving/declining/stable) with data points.
*/
CREATE TABLE IF NOT EXISTS engagement_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    trend_type TEXT NOT NULL, -- 'overall', 'by_department', 'by_tenure', 'by_role'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    data_points JSONB NOT NULL,
    trend_direction TEXT, -- 'improving', 'declining', 'stable'
    insights TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- INDEXES
-- =====================

-- Survey indexes
CREATE INDEX IF NOT EXISTS idx_engagement_surveys_status ON engagement_surveys (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_survey_responses_employee ON survey_responses (tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_survey_participation_status ON survey_participation (tenant_id, status);

-- Recognition indexes
CREATE INDEX IF NOT EXISTS idx_recognitions_receiver ON recognitions (tenant_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_recognitions_status ON recognitions (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_employee_points_balance ON employee_points (tenant_id, points_available DESC);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_employee_feedback_author ON employee_feedback (tenant_id, author_id);
CREATE INDEX IF NOT EXISTS idx_employee_feedback_status ON employee_feedback (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_employee ON feedback_votes (tenant_id, employee_id);

-- Pulse and mood indexes
CREATE INDEX IF NOT EXISTS idx_pulse_responses_date ON pulse_responses (tenant_id, response_date);
CREATE INDEX IF NOT EXISTS idx_mood_tracking_employee ON mood_tracking (tenant_id, employee_id, track_date);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_engagement_scores_date ON engagement_scores (tenant_id, calculation_date);
CREATE INDEX IF NOT EXISTS idx_team_metrics_date ON team_engagement_metrics (tenant_id, metric_date);

-- =====================
-- TRIGGERS & FUNCTIONS
-- =====================

-- Updated_at trigger for all engagement tables
-- Explicit BEFORE UPDATE triggers using update_updated_at_column()
CREATE TRIGGER update_engagement_surveys_updated_at BEFORE UPDATE ON engagement_surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_survey_questions_updated_at BEFORE UPDATE ON survey_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_survey_participation_updated_at BEFORE UPDATE ON survey_participation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recognition_programs_updated_at BEFORE UPDATE ON recognition_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recognitions_updated_at BEFORE UPDATE ON recognitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_points_updated_at BEFORE UPDATE ON employee_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rewards_catalog_updated_at BEFORE UPDATE ON rewards_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reward_redemptions_updated_at BEFORE UPDATE ON reward_redemptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_channels_updated_at BEFORE UPDATE ON feedback_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_feedback_updated_at BEFORE UPDATE ON employee_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_comments_updated_at BEFORE UPDATE ON feedback_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_actions_updated_at BEFORE UPDATE ON feedback_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pulse_questions_updated_at BEFORE UPDATE ON pulse_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_engagement_scores_updated_at BEFORE UPDATE ON engagement_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_engagement_metrics_updated_at BEFORE UPDATE ON team_engagement_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_engagement_trends_updated_at BEFORE UPDATE ON engagement_trends FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update employee points on recognition
CREATE OR REPLACE FUNCTION update_employee_points() RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'awarded' AND OLD.status != 'awarded' THEN
        -- Update receiver's points
        INSERT INTO employee_points (tenant_id, employee_id, total_points_earned, points_available, points_redeemed)
        VALUES (NEW.tenant_id, NEW.receiver_id, NEW.points_awarded, NEW.points_awarded, 0)
        ON CONFLICT (tenant_id, employee_id)
        DO UPDATE SET
            total_points_earned = employee_points.total_points_earned + NEW.points_awarded,
            points_available = employee_points.points_available + NEW.points_awarded,
            updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_employee_points ON recognitions;
CREATE TRIGGER trg_update_employee_points AFTER UPDATE ON recognitions
FOR EACH ROW EXECUTE PROCEDURE update_employee_points();

-- Auto-calculate sentiment for text responses
CREATE OR REPLACE FUNCTION calculate_sentiment() RETURNS trigger AS $$
BEGIN
    IF NEW.response_value IS NOT NULL AND NEW.sentiment IS NULL THEN
        -- Simple sentiment analysis (in production, integrate with NLP service)
        NEW.sentiment := CASE
            WHEN NEW.response_value ILIKE '%excellent%' OR NEW.response_value ILIKE '%amazing%' OR NEW.response_value ILIKE '%love%' THEN 'very_positive'::sentiment_score
            WHEN NEW.response_value ILIKE '%good%' OR NEW.response_value ILIKE '%great%' OR NEW.response_value ILIKE '%happy%' THEN 'positive'::sentiment_score
            WHEN NEW.response_value ILIKE '%average%' OR NEW.response_value ILIKE '%ok%' OR NEW.response_value ILIKE '%fine%' THEN 'neutral'::sentiment_score
            WHEN NEW.response_value ILIKE '%bad%' OR NEW.response_value ILIKE '%poor%' OR NEW.response_value ILIKE '%disappoint%' THEN 'negative'::sentiment_score
            WHEN NEW.response_value ILIKE '%terrible%' OR NEW.response_value ILIKE '%awful%' OR NEW.response_value ILIKE '%hate%' THEN 'very_negative'::sentiment_score
            ELSE 'neutral'::sentiment_score
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_sentiment ON survey_responses;
CREATE TRIGGER trg_calculate_sentiment BEFORE INSERT OR UPDATE ON survey_responses
FOR EACH ROW EXECUTE PROCEDURE calculate_sentiment();

-- =====================
-- VIEWS FOR REPORTING
-- =====================

-- Employee engagement dashboard view
CREATE OR REPLACE VIEW employee_engagement_dashboard AS
SELECT 
    e.tenant_id,
    e.id AS employee_id,
    e.employee_code AS employee_number,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    d.name AS department_name,
    ep.points_available,
    (SELECT AVG(overall_score) FROM engagement_scores WHERE employee_id = e.id) AS avg_engagement_score,
    (SELECT COUNT(*) FROM recognitions WHERE receiver_id = e.id AND status = 'awarded') AS recognitions_received,
    (SELECT COUNT(*) FROM survey_participation WHERE employee_id = e.id AND status = 'completed') AS surveys_completed,
    (SELECT mood_score FROM mood_tracking WHERE employee_id = e.id ORDER BY track_date DESC LIMIT 1) AS latest_mood
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN employee_points ep ON e.id = ep.employee_id
WHERE e.deleted_at IS NULL AND e.employment_status = 'active';

-- Team engagement summary view
CREATE OR REPLACE VIEW team_engagement_summary AS
SELECT 
    tem.tenant_id,
    tem.department_id,
    d.name AS department_name,
    tem.team_id,
    NULL::TEXT AS team_name,
    tem.engagement_score,
    tem.participation_rate,
    tem.eNPS,
    tem.turnover_rate,
    tem.metric_date,
    (SELECT COUNT(*) FROM employees e WHERE e.department_id = tem.department_id AND e.deleted_at IS NULL) AS total_employees,
    (SELECT AVG(mood_score) FROM mood_tracking mt 
     JOIN employees e ON mt.employee_id = e.id 
     WHERE e.department_id = tem.department_id AND mt.track_date = tem.metric_date) AS avg_mood_score
FROM team_engagement_metrics tem
LEFT JOIN departments d ON tem.department_id = d.id;

-- Recognition leaderboard view
CREATE OR REPLACE VIEW recognition_leaderboard AS
SELECT 
    r.tenant_id,
    receiver_id,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    d.name AS department_name,
    COUNT(*) AS total_recognitions,
    SUM(points_awarded) AS total_points,
    RANK() OVER (PARTITION BY r.tenant_id ORDER BY SUM(points_awarded) DESC) AS rank
FROM recognitions r
JOIN employees e ON r.receiver_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
WHERE r.status = 'awarded' AND r.deleted_at IS NULL
GROUP BY r.tenant_id, receiver_id, e.first_name, e.last_name, d.name;

-- =====================
-- FULL-TEXT SEARCH
-- =====================

-- Add search vectors for feedback and recognition
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE recognitions ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_employee_feedback_search ON employee_feedback USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_recognitions_search ON recognitions USING GIN (search_vector);

-- Feedback search vector update
CREATE OR REPLACE FUNCTION trg_update_feedback_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        coalesce(NEW.title, '') || ' ' || 
        coalesce(NEW.content, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feedback_search_vector ON employee_feedback;
CREATE TRIGGER trg_feedback_search_vector BEFORE INSERT OR UPDATE ON employee_feedback
FOR EACH ROW EXECUTE PROCEDURE trg_update_feedback_search_vector();

-- Recognition search vector update
CREATE OR REPLACE FUNCTION trg_update_recognition_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        coalesce(NEW.title, '') || ' ' || 
        coalesce(NEW.message, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recognition_search_vector ON recognitions;
CREATE TRIGGER trg_recognition_search_vector BEFORE INSERT OR UPDATE ON recognitions
FOR EACH ROW EXECUTE PROCEDURE trg_update_recognition_search_vector();

-- End of Employee Engagement schema

-- ====================================
-- ROW-LEVEL SECURITY (RLS)
-- ====================================
ALTER TABLE engagement_surveys        ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_participation      ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognition_programs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognitions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognition_tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_points           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_catalog           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_channels         ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_feedback         ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_votes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_actions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_responses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_tracking             ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_engagement_metrics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_trends         ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON engagement_surveys       USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON survey_questions         USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON survey_responses         USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON survey_participation     USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON recognition_programs     USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON recognitions             USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON recognition_tags         USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON employee_points          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON rewards_catalog          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON reward_redemptions       USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON feedback_channels        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON employee_feedback        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON feedback_comments        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON feedback_votes           USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON feedback_actions         USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON pulse_questions          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON pulse_responses          USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON mood_tracking            USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON engagement_scores        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON team_engagement_metrics  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON engagement_trends        USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

--