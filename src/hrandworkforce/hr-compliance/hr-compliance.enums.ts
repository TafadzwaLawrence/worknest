export enum SalaryRevisionType {
  JOINING = 'joining',
  PROMOTION = 'promotion',
  ANNUAL_REVIEW = 'annual_review',
  MARKET_ADJUSTMENT = 'market_adjustment',
  CORRECTION = 'correction',
  OFF_CYCLE = 'off_cycle',
}

export enum AssetStatus {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  IN_MAINTENANCE = 'in_maintenance',
  RETIRED = 'retired',
  DISPOSED = 'disposed',
}

export enum DisciplinarySeverity {
  VERBAL_WARNING = 'verbal_warning',
  WRITTEN_WARNING = 'written_warning',
  FINAL_WARNING = 'final_warning',
  SUSPENSION = 'suspension',
  TERMINATION = 'termination',
}

export enum DisciplinaryStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  WITHDRAWN = 'withdrawn',
}

export enum PipStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  WITHDRAWN = 'withdrawn',
}

export enum NotificationType {
  SYSTEM = 'system',
  WORKFLOW = 'workflow',
  REMINDER = 'reminder',
  ALERT = 'alert',
  INFO = 'info',
  APPROVAL_REQUIRED = 'approval_required',
}

export enum LoanType {
  SALARY_ADVANCE = 'salary_advance',
  PERSONAL_LOAN = 'personal_loan',
  EMERGENCY_LOAN = 'emergency_loan',
  EDUCATION_LOAN = 'education_loan',
}

export enum LoanStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DISBURSED = 'disbursed',
  REPAYING = 'repaying',
  SETTLED = 'settled',
  DEFAULTED = 'defaulted',
  REJECTED = 'rejected',
}
