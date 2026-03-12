export enum ReviewType {
  ANNUAL = 'annual',
  QUARTERLY = 'quarterly',
  PROBATION = 'probation',
  PROMOTION = 'promotion',
  PROJECT = 'project',
  THREE_SIXTY = '360',
}

export enum ReviewStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RatingScale {
  SCALE_1_5 = '1-5',
  SCALE_1_10 = '1-10',
  PERCENTAGE = 'percentage',
  TEXT = 'text',
  CUSTOM = 'custom',
}

export enum GoalStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_TRACK = 'on_track',
  AT_RISK = 'at_risk',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum GoalType {
  COMPANY = 'company',
  DEPARTMENT = 'department',
  TEAM = 'team',
  INDIVIDUAL = 'individual',
}

export enum GoalPeriod {
  ANNUAL = 'annual',
  QUARTERLY = 'quarterly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export enum CompetencyLevel {
  NOVICE = 'novice',
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum EnrollmentStatus {
  ENROLLED = 'enrolled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PASSED = 'passed',
  FAILED = 'failed',
  DROPPED = 'dropped',
}

export enum ContentType {
  VIDEO = 'video',
  DOCUMENT = 'document',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  LINK = 'link',
  SCORM = 'scorm',
}
