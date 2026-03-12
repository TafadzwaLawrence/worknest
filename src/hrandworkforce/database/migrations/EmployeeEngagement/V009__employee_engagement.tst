Title: Employee Engagement Schema – Documentation

Scope
- Domain: Employee engagement covering surveys, recognition, feedback, pulse checks, mood tracking, and analytics.
- Purpose: Enable multi-tenant engagement programs with analytics, sentiment, rewards, and participation tracking.
- Integrations: Core HR (employees, departments, teams), Workflows, Tenants, Users.
- Multitenancy: tenant_id on all tables; isolation through FKs; analytics across tenant partitions.
- Governance: Audit timestamps, soft deletes for select entities, updated_at triggers; FTS for searchable content.

Database Extensions and Helpers
- uuid-ossp: UUID generation for PKs.
- citext: available.
- update_updated_at_column(): maintain updated_at.

Enumerated Types
- survey_status: draft, active, paused, completed, archived
- survey_type: engagement, pulse, onboarding, exit, custom
- question_type: multiple_choice, rating_scale, text, likert, ranking, matrix
- recognition_type: peer_to_peer, manager_to_employee, team, company_wide, milestone
- feedback_visibility: public, private, anonymous, confidential
- sentiment_score: very_negative, negative, neutral, positive, very_positive

Survey Management
1) engagement_surveys
- Purpose: Survey campaigns with lifecycle status, anonymity/confidentiality, and reminders/goal.
- Columns: id, tenant_id, title, description, survey_type, frequency, status, is_anonymous, is_confidential, start_date, end_date, reminder_settings JSONB, participation_goal, created_by, created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, title)
- Indexes: idx_engagement_surveys_status
- Trigger: update_engagement_surveys_updated_at

2) survey_questions
- Purpose: Questions per survey with type, options, weights, and ordering.
- Columns: id, tenant_id, survey_id, question_text, question_type, position, is_required, options JSONB, weight, category, benchmark_value, created_at, updated_at, deleted_at
- Trigger: update_survey_questions_updated_at

3) survey_responses
- Purpose: Responses per (survey, employee, question) with optional sentiment and numeric values.
- Columns: id, tenant_id, survey_id, employee_id, question_id, response_value, numeric_value, selected_options JSONB, sentiment, response_time_seconds, submitted_at, created_at
- Constraints: UNIQUE(tenant_id, survey_id, employee_id, question_id)
- Indexes: idx_survey_responses_employee(tenant_id, employee_id)

4) survey_participation
- Purpose: Track invitations, starts, completions, reminders per employee per survey.
- Columns: id, tenant_id, survey_id, employee_id, invited_at, started_at, completed_at, last_reminder_sent, reminder_count, status, created_at, updated_at
- Constraints: UNIQUE(tenant_id, survey_id, employee_id)
- Indexes: idx_survey_participation_status(tenant_id, status)
- Trigger: update_survey_participation_updated_at

Recognition & Rewards
5) recognition_programs
- Purpose: Define recognition programs (types, points, approvals, budget, window).
- Columns: id, tenant_id, name, description, recognition_type, points_value, approval_required, workflow_id, is_active, budget, start_date, end_date, created_by, created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, name)
- Trigger: update_recognition_programs_updated_at

6) recognitions
- Purpose: Recognition awards between employees with visibility and status transitions; search enabled.
- Columns: id, tenant_id, program_id, giver_id, receiver_id, recognition_type, title, message, points_awarded, visibility, is_anonymous, status, approved_by, approved_at, awarded_at, created_at, updated_at, deleted_at, search_vector tsvector
- Indexes: idx_recognitions_receiver(tenant_id, receiver_id); idx_recognitions_status(tenant_id, status); idx_recognitions_search (GIN)
- Triggers: update_recognitions_updated_at; trg_recognition_search_vector -> trg_update_recognition_search_vector(); trg_update_employee_points (AFTER UPDATE) -> update_employee_points()

7) recognition_tags
- Purpose: Key-value tags on recognitions for classification.
- Columns: id, tenant_id, recognition_id, tag, value, created_at
- Constraints: UNIQUE(tenant_id, recognition_id, tag)

8) employee_points
- Purpose: Points balance for employees with totals and availability; maintained via triggers when recognitions are awarded.
- Columns: id, tenant_id, employee_id, total_points_earned, points_available, points_redeemed, last_earned_date, created_at, updated_at
- Constraints: UNIQUE(tenant_id, employee_id)
- Indexes: idx_employee_points_balance(tenant_id, points_available DESC)
- Trigger: update_employee_points_updated_at

9) rewards_catalog
- Purpose: Rewards catalog for redemptions.
- Columns: id, tenant_id, name, description, points_cost, category, inventory_count, max_per_employee, is_active, image_url, start_date, end_date, created_by, created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, name)
- Trigger: update_rewards_catalog_updated_at

10) reward_redemptions
- Purpose: Redemption workflow with statuses and points used.
- Columns: id, tenant_id, employee_id, reward_id, points_used, status, requested_at, approved_by, approved_at, fulfilled_at, created_at, updated_at
- Trigger: update_reward_redemptions_updated_at

Feedback & Suggestions
11) feedback_channels
- Purpose: Feedback intake channels with moderation and anonymity options.
- Columns: id, tenant_id, name, description, category, is_active, moderation_required, anonymity_allowed, created_by, created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, name)
- Trigger: update_feedback_channels_updated_at

12) employee_feedback
- Purpose: Feedback items with sentiment, visibility, vote counts, and status/priority; FTS enabled.
- Columns: id, tenant_id, channel_id, author_id, title, content, sentiment, visibility, is_anonymous, status, priority, upvotes, downvotes, created_at, updated_at, deleted_at, search_vector tsvector
- Indexes: idx_employee_feedback_author; idx_employee_feedback_status; idx_employee_feedback_search (GIN)
- Trigger: update_employee_feedback_updated_at; trg_feedback_search_vector -> trg_update_feedback_search_vector()

13) feedback_comments
- Purpose: Comments/discussions on feedback items with sentiment and anonymity.
- Columns: id, tenant_id, feedback_id, author_id, content, sentiment, is_anonymous, created_at, updated_at, deleted_at
- Trigger: update_feedback_comments_updated_at

14) feedback_votes
- Purpose: Voting per employee per feedback (upvote/downvote) for prioritization.
- Columns: id, tenant_id, feedback_id, employee_id, vote_type, created_at
- Constraints: UNIQUE(tenant_id, feedback_id, employee_id)
- Indexes: idx_feedback_votes_employee(tenant_id, employee_id)

15) feedback_actions
- Purpose: Action items derived from feedback with assignment and tracking.
- Columns: id, tenant_id, feedback_id, assigned_to, action_text, due_date, status, completed_at, created_by, created_at, updated_at
- Trigger: update_feedback_actions_updated_at

Pulse Checks & Mood
16) pulse_questions
- Purpose: Pulse question bank.
- Columns: id, tenant_id, question_text, question_type, scale_min, scale_max, category, is_active, frequency, created_by, created_at, updated_at, deleted_at
- Trigger: update_pulse_questions_updated_at

17) pulse_responses
- Purpose: Periodic pulse responses per employee per question with sentiment.
- Columns: id, tenant_id, question_id, employee_id, response_value NUMERIC(5,2), sentiment, comments, response_date, created_at
- Constraints: UNIQUE(tenant_id, question_id, employee_id, response_date)
- Indexes: idx_pulse_responses_date(tenant_id, response_date)

18) mood_tracking
- Purpose: Employee mood entries with score/emoji/factors/comments per date.
- Columns: id, tenant_id, employee_id, mood_score INT CHECK 1..5, mood_emoji, factors JSONB, comments, track_date DATE, created_at
- Constraints: UNIQUE(tenant_id, employee_id, track_date)
- Indexes: idx_mood_tracking_employee(tenant_id, employee_id, track_date)

Analytics
19) engagement_scores
- Purpose: Computed engagement scores per employee per day with category breakdowns.
- Columns: id, tenant_id, employee_id, overall_score, category_scores JSONB, benchmark_comparison, calculation_date, created_at, updated_at
- Constraints: UNIQUE(tenant_id, employee_id, calculation_date)
- Indexes: idx_engagement_scores_date(tenant_id, calculation_date)
- Trigger: update_engagement_scores_updated_at

20) team_engagement_metrics
- Purpose: Aggregated team/department metrics per metric_date (engagement, eNPS, participation, turnover).
- Columns: id, tenant_id, department_id, team_id, engagement_score, participation_rate, eNPS, turnover_rate, metric_date, created_at, updated_at
- Constraints: UNIQUE(tenant_id, COALESCE(department_id, zero-uuid), COALESCE(team_id, zero-uuid), metric_date)
- Indexes: idx_team_metrics_date(tenant_id, metric_date)
- Trigger: update_team_engagement_metrics_updated_at

21) engagement_trends
- Purpose: Time-bucketed insights and trend direction with data points and narrative.
- Columns: id, tenant_id, trend_type, period_start, period_end, data_points JSONB, trend_direction, insights, created_at, updated_at
- Trigger: update_engagement_trends_updated_at

Triggers & Automation
- update_employee_points(): AFTER UPDATE on recognitions; when status transitions to 'awarded', increment receiver's points (INSERT or UPDATE with accumulation).
- calculate_sentiment(): BEFORE INSERT/UPDATE on survey_responses; sets sentiment based on simple keyword heuristics (placeholder for NLP integration).

Reporting Views
- employee_engagement_dashboard: Provides per-employee snapshot (employee info, dept, points, avg engagement score, recognitions received, surveys completed, latest mood).
- team_engagement_summary: Aggregates team/department metrics, total employees, and average mood.
- recognition_leaderboard: Summarizes recognitions and points by receiver with ranking.

Full-Text Search (FTS)
- employee_feedback.search_vector (title + content) maintained via trg_update_feedback_search_vector().
- recognitions.search_vector (title + message) maintained via trg_update_recognition_search_vector().

End of documentation.