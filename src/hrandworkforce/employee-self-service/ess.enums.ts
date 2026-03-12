export enum EssRequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum EssAckStatus {
  REQUIRED = 'required',
  ACKNOWLEDGED = 'acknowledged',
  WAIVED = 'waived',
}

export enum EssOwnerType {
  PROFILE_REQUEST = 'profile_request',
  TIME_OFF_DRAFT = 'time_off_draft',
  ACKNOWLEDGMENT = 'acknowledgment',
}

export enum AccessType {
  VIEW = 'view',
  DOWNLOAD = 'download',
}
