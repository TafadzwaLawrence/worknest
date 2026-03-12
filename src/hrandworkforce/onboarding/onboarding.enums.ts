export enum OnboardingStatus {
  Planned = 'planned',
  Active = 'active',
  OnHold = 'on_hold',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum OffboardingStatus {
  Planned = 'planned',
  Active = 'active',
  OnHold = 'on_hold',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Blocked = 'blocked',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum CaseType {
  Onboarding = 'onboarding',
  Offboarding = 'offboarding',
}

export enum PriorityLevel {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
  Urgent = 'urgent',
}

export enum ProvisionStatus {
  Requested = 'requested',
  Approved = 'approved',
  Provisioned = 'provisioned',
  Revoked = 'revoked',
  Rejected = 'rejected',
  Cancelled = 'cancelled',
}

export enum AssetType {
  Laptop = 'laptop',
  Desktop = 'desktop',
  Mobile = 'mobile',
  AccessCard = 'access_card',
  Key = 'key',
  SoftwareLicense = 'software_license',
  Other = 'other',
}

export enum NoteVisibility {
  Private = 'private',
  Team = 'team',
  Public = 'public',
}
