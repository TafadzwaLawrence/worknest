export enum AttendanceStatus {
  Present = 'present',
  Absent = 'absent',
  Late = 'late',
  EarlyDeparture = 'early_departure',
  HalfDay = 'half_day',
  Holiday = 'holiday',
  Leave = 'leave',
  Weekend = 'weekend',
  BusinessTrip = 'business_trip',
  Training = 'training',
  OffsiteWork = 'offsite_work',
}

export enum LeaveRequestStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Cancelled = 'cancelled',
  InReview = 'in_review',
}

export enum TimesheetStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  Approved = 'approved',
  Rejected = 'rejected',
  Processed = 'processed',
  Paid = 'paid',
}

export enum ScheduleStatus {
  Draft = 'draft',
  Published = 'published',
  Active = 'active',
  Archived = 'archived',
}

export enum ShiftStatus {
  Scheduled = 'scheduled',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
  NoShow = 'no_show',
}

export enum ApprovalStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum LeaveAccrualType {
  Annual = 'annual',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  Hourly = 'hourly',
  None = 'none',
}

export enum CorrectionType {
  ClockIn = 'clock_in',
  ClockOut = 'clock_out',
  Break = 'break',
  Status = 'status',
  Hours = 'hours',
}
