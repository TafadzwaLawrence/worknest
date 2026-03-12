export enum SurveyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum SurveyType {
  ENGAGEMENT = 'engagement',
  PULSE = 'pulse',
  ONBOARDING = 'onboarding',
  EXIT = 'exit',
  CUSTOM = 'custom',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  RATING_SCALE = 'rating_scale',
  TEXT = 'text',
  LIKERT = 'likert',
  RANKING = 'ranking',
  MATRIX = 'matrix',
}

export enum RecognitionType {
  PEER_TO_PEER = 'peer_to_peer',
  MANAGER_TO_EMPLOYEE = 'manager_to_employee',
  TEAM = 'team',
  COMPANY_WIDE = 'company_wide',
  MILESTONE = 'milestone',
}

export enum FeedbackVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  ANONYMOUS = 'anonymous',
  CONFIDENTIAL = 'confidential',
}

export enum SentimentScore {
  VERY_NEGATIVE = 'very_negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very_positive',
}
