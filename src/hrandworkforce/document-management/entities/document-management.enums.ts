export enum DocOwnerType {
  APPLICANT = 'applicant',
  APPLICATION = 'application',
  EMPLOYEE = 'employee',
  ONBOARDING_CASE = 'onboarding_case',
  OFFBOARDING_CASE = 'offboarding_case',
  OTHER = 'other',
}

export enum DocStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export enum RetentionAction {
  RETAIN = 'retain',
  ANONYMIZE = 'anonymize',
  DELETE = 'delete',
}
