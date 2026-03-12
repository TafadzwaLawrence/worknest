Title: Performance & Development Schema – Documentation

Scope
- Domain: Performance reviews, goal management, competencies/skills, and learning integration in a multi-tenant HR system.
- Purpose: Support cycles, templates, reviews, participants, responses; goals with alignment/updates; competency frameworks and skills; course/learning hooks and analytics.
- Integrations: Core HR (employees, departments), Users, Tenants, Learning entities (courses, enrollments, etc.).
- Multitenancy: tenant_id on all tables; tenant validation triggers for key refs.
- Governance: Audit timestamps and explicit updated_at triggers; soft deletes on select entities; FTS for courses/goals.

Database Extensions and Helpers
- uuid-ossp: UUID PK generation.
- citext: available for reuse.
- update_updated_at_column(): maintains updated_at.

Enumerated Types
- review_type: annual, quarterly, probation, promotion, project, 360
- review_status: draft, scheduled, in_progress, completed, cancelled
- rating_scale: 1-5, 1-10, percentage, text, custom
- goal_status: draft, active, on_track, at_risk, completed, cancelled
- goal_type: company, department, team, individual
- goal_period: annual, quarterly, monthly, custom
- competency_level: novice, basic, intermediate, advanced, expert
- course_status: draft, published, archived
- enrollment_status: enrolled, in_progress, completed, passed, failed, dropped
- content_type: video, document, quiz, assignment, link, scorm

Performance Management
1) review_cycles
- Purpose: Define performance review cycles with dates and reminders.
- Columns: id, tenant_id, name, description, review_type, start_date, end_date, due_date, is_active, auto_reminder, reminder_days_before[], created_by, created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, name)
- Triggers: update_review_cycles_updated_at

2) review_templates
- Purpose: Templates with review_type, rating_scale, questions and weightings.
- Columns: id, tenant_id, name, description, review_type, rating_scale, questions JSONB, weightings JSONB, is_active, created_by, created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, name)
- Triggers: update_review_templates_updated_at

3) performance_reviews
- Purpose: Individual reviews tied to cycles/templates with ratings, comments, and flags.
- Columns: id, tenant_id, employee_id, reviewer_id, review_cycle_id, template_id, review_type, status, start_date, end_date, due_date, overall_rating, overall_comments, strengths, development_areas, recommendations JSONB, is_self_review, is_anonymous, completed_at, created_by, created_at, updated_at, deleted_at
- Indexes: idx_performance_reviews_employee; idx_performance_reviews_cycle; idx_performance_reviews_status
- Triggers: update_performance_reviews_updated_at; tenant validation (trg_validate_performance_tenant)

4) review_participants
- Purpose: 360 participants with relationship type, weighting, completion flags.
- Columns: id, tenant_id, review_id, participant_id, relationship_type, weight, is_required, is_completed, completed_at, invited_at, reminder_sent_at, created_at, updated_at
- Constraints: UNIQUE(review_id, participant_id)
- Triggers: update_review_participants_updated_at

5) review_responses
- Purpose: Responses per (review, participant, question) with rating/comments/evidence.
- Columns: id, tenant_id, review_id, participant_id, question_id, rating, comments, evidence JSONB, submitted_at, created_at, updated_at
- Constraints: UNIQUE(review_id, participant_id, question_id)
- Triggers: update_review_responses_updated_at

Goal Management
6) goal_templates
- Purpose: Goal templates (OKR/SMART) with default metrics and category.
- Columns: id, tenant_id, name, description, goal_type, category, default_metrics JSONB, is_active, created_by, created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, name)
- Triggers: update_goal_templates_updated_at

7) goals
- Purpose: Employee goals with hierarchy (parent_goal_id), period, status, progress, and OKR fields.
- Columns: id, tenant_id, employee_id, parent_goal_id, template_id, title, description, goal_type, category, period, start_date, end_date, target_value, current_value, unit, status, progress, weight, is_private, key_results JSONB, milestones JSONB, created_by, created_at, updated_at, deleted_at, search_vector tsvector
- Indexes: idx_goals_employee; idx_goals_status; idx_goals_period; idx_goals_search_vector (GIN)
- Triggers: update_goals_updated_at; trg_goal_search_vector -> trg_update_goal_search_vector(); tenant validation

8) goal_alignments
- Purpose: Linkage between goals to represent alignment relationships.
- Columns: id, tenant_id, goal_id, aligned_goal_id, alignment_strength, description, created_by, created_at
- Constraints: UNIQUE(goal_id, aligned_goal_id)
- Triggers: update_goal_alignments_updated_at

9) goal_updates
- Purpose: Progress updates and commentary for goals.
- Columns: id, tenant_id, goal_id, employee_id, previous_value, new_value, progress_change, comments, challenges, support_needed, update_date, created_at
- Triggers: update_goal_updates_updated_at

Competency & Skills
10) competency_frameworks
- Purpose: Competency frameworks with versioning and activation.
- Columns: id, tenant_id, name, description, version, is_active, created_by, created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, name)
- Triggers: update_competency_frameworks_updated_at

11) competencies
- Purpose: Competency definitions within frameworks; hierarchical via parent_id.
- Columns: id, tenant_id, framework_id, parent_id, name, description, category, weight, behavioral_indicators JSONB, is_core, created_by, created_at, updated_at, deleted_at
- Constraints: UNIQUE(framework_id, name)
- Triggers: update_competencies_updated_at

12) employee_competencies
- Purpose: Employee competency assessments, targets, evidence, and confidence.
- Columns: id, tenant_id, employee_id, competency_id, current_level, target_level, self_assessment_date, manager_assessment_date, assessment_method, confidence_level, evidence JSONB, created_at, updated_at
- Constraints: UNIQUE(employee_id, competency_id)
- Indexes: idx_employee_competencies(tenant_id, employee_id)
- Triggers: update_employee_competencies_updated_at

13) skills
- Purpose: Skill inventory with categories and tags.
- Columns: id, tenant_id, name, description, category, tags TEXT[], is_technical, created_by, created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, name)
- Triggers: update_skills_updated_at

14) employee_skills
- Purpose: Employee skill profiles with proficiency/interest and certifications.
- Columns: id, tenant_id, employee_id, skill_id, proficiency_level (1..5), years_experience, last_used, interest_level (1..5), is_certified, certification_date, expiry_date, created_at, updated_at
- Constraints: UNIQUE(employee_id, skill_id)
- Indexes: idx_employee_skills(tenant_id, employee_id)
- Triggers: update_employee_skills_updated_at

Learning Integration (referenced in triggers/indexes/views)
- courses, course_modules, course_content, course_enrollments, learning_paths, training_requests, development_plans, development_plan_items
- Triggers exist to maintain updated_at on these tables as part of integration points.

Tenant Validation Trigger
- trg_validate_performance_tenant: Ensures referenced employee_id and review_cycle_id belong to the same tenant as NEW.tenant_id.
- Attached to: performance_reviews, goals, course_enrollments.

Reporting Views
- employee_development_summary: Per-employee snapshot (completed reviews, active goals, completed courses, competencies assessed, top five skills).
- goal_progress_dashboard: Goal metadata with progress and update counts; joins employee and department data.
- learning_completion_report: Learning completion metrics per enrollment with duration to complete.

Full-Text Search (FTS)
- courses.search_vector maintained by trg_update_course_search_vector(); idx_courses_search_vector (GIN).
- goals.search_vector maintained by trg_update_goal_search_vector(); idx_goals_search_vector (GIN).

End of documentation.