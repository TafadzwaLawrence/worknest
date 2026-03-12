-- V012: Add missing columns that exist in entities but were absent from initial migrations

-- 1. roles table: add soft-delete support
ALTER TABLE roles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. courses table: add columns present in the Course entity but missing from V008
--    (Note: entities 'level' field uses @Column({ name: 'difficulty_level' }) so no new column needed for that)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS validity_period_days DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS passing_score NUMERIC(5,2) DEFAULT 70;

-- 3. development_plans table: add career_goal column present in DevelopmentPlan entity
ALTER TABLE development_plans ADD COLUMN IF NOT EXISTS career_goal TEXT;
