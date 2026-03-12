export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum InstanceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  ESCALATED = 'escalated',
  COMPLETED = 'completed',
}

export enum StepType {
  APPROVAL = 'approval',
  REVIEW = 'review',
  NOTIFICATION = 'notification',
  TASK = 'task',
  CONDITION = 'condition',
  AUTOMATION = 'automation',
}

export enum ApprovalAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CHANGES = 'request_changes',
  DELEGATE = 'delegate',
  ESCALATE = 'escalate',
}

export enum AssignmentType {
  USER = 'user',
  ROLE = 'role',
  DEPARTMENT = 'department',
  DYNAMIC = 'dynamic',
  REPORTING_MANAGER = 'reporting_manager',
  SPECIFIC_POSITION = 'specific_position',
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IN = 'in',
  NOT_IN = 'not_in',
}

export enum EscalationStrategy {
  NEXT_LEVEL = 'next_level',
  SPECIFIC_USER = 'specific_user',
  ROLE_BASED = 'role_based',
  TIME_BASED = 'time_based',
  MULTIPLE_APPROVERS = 'multiple_approvers',
}
