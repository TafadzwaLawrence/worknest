export enum JobStatus {
  OPEN = 'open',
  ON_HOLD = 'on_hold',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum ApplicationStatus {
  APPLIED = 'applied',
  SCREENING = 'screening',
  PHONE_SCREEN = 'phone_screen',
  ASSESSMENT = 'assessment',
  INTERVIEWING = 'interviewing',
  OFFER = 'offer',
  HIRED = 'hired',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  RESCHEDULED = 'rescheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum OfferStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ISSUED = 'issued',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  WITHDRAWN = 'withdrawn',
}

export enum ApplicantContactType {
  EMAIL = 'email',
  PHONE = 'phone',
  MOBILE = 'mobile',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  OTHER = 'other',
}

export enum DocumentType {
  RESUME = 'resume',
  COVER_LETTER = 'cover_letter',
  PORTFOLIO = 'portfolio',
  TRANSCRIPT = 'transcript',
  CERTIFICATE = 'certificate',
  ID_PROOF = 'id_proof',
  VISA = 'visa',
  WORK_PERMIT = 'work_permit',
  REFERENCE_LETTER = 'reference_letter',
  PERFORMANCE_REVIEW = 'performance_review',
  CONTRACT = 'contract',
  OFFER_LETTER = 'offer_letter',
  BACKGROUND_CHECK = 'background_check',
  DRIVING_LICENSE = 'driving_license',
  PASSPORT = 'passport',
  DEGREE = 'degree',
  DIPLOMA = 'diploma',
  OTHER = 'other',
}

export enum NoteVisibility {
  PRIVATE = 'private',
  TEAM = 'team',
  PUBLIC = 'public',
}
