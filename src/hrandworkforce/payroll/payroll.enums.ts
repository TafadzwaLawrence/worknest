export enum PayFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  SEMIMONTHLY = 'semimonthly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export enum PayMethod {
  DIRECT_DEPOSIT = 'direct_deposit',
  CHECK = 'check',
  CASH = 'cash',
  PAYROLL_CARD = 'payroll_card',
}

export enum PayrollEmploymentStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
  RETIRED = 'retired',
}

export enum DeductionType {
  TAX = 'tax',
  BENEFIT = 'benefit',
  GARNISH = 'garnish',
  RETIREMENT = 'retirement',
  OTHER = 'other',
  LOAN_REPAYMENT = 'loan_repayment',
}

export enum BenefitType {
  HEALTH = 'health',
  DENTAL = 'dental',
  VISION = 'vision',
  RETIREMENT = 'retirement',
  LIFE_INSURANCE = 'life_insurance',
  DISABILITY = 'disability',
  FLEX_SPENDING = 'flex_spending',
  HSA = 'hsa',
  OTHER = 'other',
}

export enum TaxFilingStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  MARRIED_SEPARATE = 'married_separate',
  HEAD_HOUSEHOLD = 'head_household',
  QUALIFYING_WIDOW = 'qualifying_widow',
}

export enum PayrollStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  APPROVED = 'approved',
  PAID = 'paid',
  REVERSED = 'reversed',
  CANCELLED = 'cancelled',
}

export enum ExpenseStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}
