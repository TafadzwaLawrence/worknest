Title: Workflow Management Schema – Documentation

Scope
- Domain: Generic workflow engine for HR processes (recruitment, onboarding, leave, expense, performance, offboarding, etc.).
- Purpose: Model workflow definitions, steps, assignments, escalations, instances, actions, delegations, notifications, conditions, and analytics.
- Multitenancy: tenant_id on all tables; tenant validation via trigger for cross-table references.
- Governance: Audit timestamps, soft deletes on selected tables, and explicit BEFORE UPDATE triggers to maintain updated_at.

Database Extensions and Helpers
- uuid-ossp: UUID PK generation.
- citext: Available if needed by consumers.
- update_updated_at_column(): Standard trigger to maintain updated_at.

Enumerated Types
- workflow_status: draft, active, paused, archived
- instance_status: pending, in_progress, approved, rejected, cancelled, escalated, completed
- step_type: approval, review, notification, task, condition, automation
- approval_action: approve, reject, request_changes, delegate, escalate
- assignment_type: user, role, department, dynamic, reporting_manager, specific_position
- condition_operator: equals, not_equals, greater_than, less_than, contains, starts_with, ends_with, in, not_in
- escalation_strategy: next_level, specific_user, role_based, time_based, multiple_approvers

Workflow Definitions
1) workflows
- Purpose: Workflow template per tenant with category, entity_type, and versioning.
- Columns: id, tenant_id, name, description, category, entity_type, version, status, is_default, conditions JSONB, metadata JSONB, created_by, updated_by, created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, name, version)
- Indexes: idx_workflows_tenant; idx_workflows_category; idx_workflows_status
- Trigger: update_workflows_updated_at

2) workflow_steps
- Purpose: Ordered steps in a workflow (approval/review/notification/task/condition/automation) with actions/conditions.
- Columns: id, tenant_id, workflow_id, name, description, step_type, position, is_required, timeout_hours, approval_threshold, actions_allowed approval_action[], conditions JSONB, instructions, created_by, created_at, updated_at, deleted_at
- Indexes: idx_workflow_steps_workflow(tenant_id, workflow_id); idx_workflow_steps_position(tenant_id, workflow_id, position)
- Triggers: update_workflow_steps_updated_at; tenant validation (trg_validate_workflow_tenant)

3) step_assignments
- Purpose: Who can act at a step (user/role/department/dynamic/reporting_manager/specific_position) with priority and fallback.
- Columns: id, tenant_id, step_id, assignment_type, assignee_id, assignee_value, fallback_assignee_id, priority, created_by, created_at, updated_at, deleted_at
- Trigger: update_step_assignments_updated_at

4) escalation_rules
- Purpose: Escalation strategies with after_hours, target_type/id/value, and notifications.
- Columns: id, tenant_id, step_id, strategy, after_hours, target_type, target_id, target_value, max_escalations, notify_original_assignee, created_by, created_at, updated_at, deleted_at
- Trigger: update_escalation_rules_updated_at

Workflow Execution
5) workflow_instances
- Purpose: Running instance of a workflow bound to an entity record.
- Columns: id, tenant_id, workflow_id, entity_id, entity_type, initiator_id, current_step_id, status, priority, due_date, completed_at, cancellation_reason, metadata JSONB, created_at, updated_at, deleted_at
- Indexes: idx_workflow_instances_entity(tenant_id, entity_type, entity_id); idx_workflow_instances_status(tenant_id, status); idx_workflow_instances_initiator(tenant_id, initiator_id)
- Trigger: update_workflow_instances_updated_at; tenant validation

6) instance_steps
- Purpose: Track per-step progress and assignments in a workflow instance.
- Columns: id, tenant_id, instance_id, step_id, assigned_to, assigned_at, status, due_date, completed_at, action_taken, comments, time_taken_seconds, escalated_from, created_at, updated_at
- Indexes: idx_instance_steps_instance; idx_instance_steps_assigned(tenant_id, assigned_to, status); idx_instance_steps_due_date (partial where status='pending')
- Trigger: update_instance_steps_updated_at; tenant validation

7) step_actions
- Purpose: Append-only history of actions taken on instance_steps.
- Columns: id, tenant_id, instance_step_id, action_by, action_taken, comments, metadata JSONB, created_at

8) step_delegations
- Purpose: Delegate a step to another user for a time window.
- Columns: id, tenant_id, instance_step_id, original_assignee, delegated_to, reason, start_date, end_date, is_active, created_at, updated_at
- Trigger: update_step_delegations_updated_at

Notifications & Templates
9) workflow_notifications
- Purpose: Notification records for workflow events (assignment/reminder/escalation/completion/cancellation).
- Columns: id, tenant_id, instance_id, instance_step_id, recipient_id, notification_type, subject, message, priority, is_read, read_at, action_required, action_url, sent_via[], sent_at, created_at
- Indexes: idx_workflow_notifications_recipient; idx_workflow_notifications_sent

10) notification_templates
- Purpose: Templates for notifications with variable maps.
- Columns: id, tenant_id, name, description, notification_type, subject_template, body_template, variables JSONB, is_active, created_by, created_at, updated_at, deleted_at
- Constraints: UNIQUE(tenant_id, name)
- Trigger: update_notification_templates_updated_at

Conditions & Rules
11) workflow_conditions
- Purpose: Declarative conditions on entity fields for preconditions/routing/validation.
- Columns: id, tenant_id, name, description, condition_type, entity_type, field_path, operator, comparison_value, comparison_values[], error_message, is_active, created_by, created_at, updated_at, deleted_at
- Trigger: update_workflow_conditions_updated_at

12) condition_groups
- Purpose: Group conditions using logical operators (AND/OR) to form complex logic.
- Columns: id, tenant_id, name, description, logical_operator, conditions JSONB, is_active, created_by, created_at, updated_at, deleted_at
- Trigger: update_condition_groups_updated_at

Analytics & Metrics
13) workflow_metrics
- Purpose: Aggregated workflow metrics by period.
- Columns: id, tenant_id, workflow_id, period_start, period_end, total_instances, completed_instances, avg_completion_time_seconds, approval_rate, rejection_rate, escalation_rate, avg_steps_per_instance, created_at, updated_at
- Constraints: UNIQUE(tenant_id, workflow_id, period_start)
- Indexes: idx_workflow_metrics_period
- Trigger: update_workflow_metrics_updated_at

14) step_metrics
- Purpose: Aggregated per-step metrics by period.
- Columns: id, tenant_id, step_id, period_start, period_end, total_assignments, avg_completion_time_seconds, approval_count, rejection_count, escalation_count, delegation_count, created_at, updated_at
- Constraints: UNIQUE(tenant_id, step_id, period_start)
- Indexes: idx_step_metrics_period
- Trigger: update_step_metrics_updated_at

Integrations with HR Entities
- leave_request_workflows: link leave_requests to workflow_instances; UNIQUE(tenant_id, leave_request_id); triggers: update_leave_request_workflows_updated_at
- expense_workflows: link expense_reports to workflow_instances; UNIQUE(tenant_id, expense_report_id); triggers: update_expense_workflows_updated_at
- recruitment_workflows: link recruitment applications to workflow_instances; UNIQUE(tenant_id, application_id); triggers: update_recruitment_workflows_updated_at

Tenant Validation & Automation
- trg_validate_workflow_tenant: Validates workflow_id and step_id references belong to the same tenant as NEW.tenant_id. Attached to workflow_steps, workflow_instances, instance_steps.
- check_step_escalations(): Bulk UPDATE function marking pending instance_steps as escalated when assigned_at + after_hours has elapsed according to escalation_rules.

Reporting Views
- workflow_instance_status: Summarizes workflow instance status, entity binding, current step, and basic metrics like duration and counts.
- user_pending_tasks: Lists pending tasks for users with step metadata and time since assignment.
- workflow_performance_analytics: Aggregates per-workflow counts and duration metrics, including p95 completion time.

Security Notes
- Consider Row Level Security (RLS), encryption for sensitive data, audit logging, and rate limiting in production deployments.

End of documentation.