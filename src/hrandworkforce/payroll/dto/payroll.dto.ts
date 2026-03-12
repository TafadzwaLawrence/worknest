import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsEnum, IsUUID, IsArray, ValidateNested, IsObject } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { PayFrequency, PayMethod, BenefitType, TaxFilingStatus, PayrollStatus, DeductionType, ExpenseStatus } from '../payroll.enums.js';

// ─── Pay Structures ───────────────────────────────────────────────────────────

export class CreatePayStructureDto {
  @IsUUID()
  employee_id: string;

  @IsString()
  pay_type: string;

  @IsNumber()
  pay_rate: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsDateString()
  effective_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePayStructureDto extends PartialType(CreatePayStructureDto) {}

// ─── Employee Tax Info ────────────────────────────────────────────────────────

export class UpsertEmployeeTaxInfoDto {
  @IsUUID()
  employee_id: string;

  @IsOptional()
  @IsEnum(TaxFilingStatus)
  filing_status?: TaxFilingStatus;

  @IsOptional()
  @IsNumber()
  allowances?: number;

  @IsOptional()
  @IsNumber()
  additional_withholding?: number;

  @IsOptional()
  @IsBoolean()
  exempt_federal?: boolean;

  @IsOptional()
  @IsBoolean()
  exempt_state?: boolean;

  @IsOptional()
  @IsBoolean()
  exempt_local?: boolean;

  @IsOptional()
  @IsObject()
  w4_certificate?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  state_withholding_cert?: Record<string, unknown>;
}

// ─── Tax Jurisdictions ────────────────────────────────────────────────────────

export class CreateTaxJurisdictionDto {
  @IsString()
  jurisdiction_type: string;

  @IsString()
  jurisdiction_code: string;

  @IsString()
  name: string;

  @IsDateString()
  effective_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsObject()
  tax_rates: Record<string, unknown>;
}

export class UpdateTaxJurisdictionDto extends PartialType(CreateTaxJurisdictionDto) {}

// ─── Benefit Plans ────────────────────────────────────────────────────────────

export class CreateBenefitPlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(BenefitType)
  benefit_type: BenefitType;

  @IsOptional()
  @IsString()
  provider_name?: string;

  @IsOptional()
  @IsString()
  plan_code?: string;

  @IsOptional()
  @IsObject()
  eligibility_rules?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  employer_contribution?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  employee_contribution?: Record<string, unknown>;

  @IsDateString()
  effective_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateBenefitPlanDto extends PartialType(CreateBenefitPlanDto) {}

// ─── Benefit Enrollments ──────────────────────────────────────────────────────

export class CreateBenefitEnrollmentDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  benefit_plan_id: string;

  @IsOptional()
  @IsString()
  coverage_level?: string;

  @IsOptional()
  @IsNumber()
  election_amount?: number;

  @IsDateString()
  effective_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsDateString()
  enrollment_date: string;
}

export class UpdateBenefitEnrollmentDto extends PartialType(CreateBenefitEnrollmentDto) {}

// ─── Dependents ───────────────────────────────────────────────────────────────

export class CreateDependentDto {
  @IsUUID()
  employee_id: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString()
  relationship: string;

  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @IsOptional()
  @IsBoolean()
  is_beneficiary?: boolean;
}

export class UpdateDependentDto extends PartialType(CreateDependentDto) {}

// ─── Pay Periods ──────────────────────────────────────────────────────────────

export class CreatePayPeriodDto {
  @IsString()
  period_name: string;

  @IsEnum(PayFrequency)
  pay_frequency: PayFrequency;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsDateString()
  pay_date: string;
}

export class UpdatePayPeriodDto extends PartialType(CreatePayPeriodDto) {}

// ─── Payroll Runs ─────────────────────────────────────────────────────────────

export class CreatePayrollRunDto {
  @IsUUID()
  pay_period_id: string;

  @IsOptional()
  @IsNumber()
  run_number?: number;
}

export class UpdatePayrollRunStatusDto {
  @IsEnum(PayrollStatus)
  status: PayrollStatus;
}

// ─── Payroll Records ──────────────────────────────────────────────────────────

export class CreatePayrollRecordDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  pay_period_id: string;

  @IsOptional()
  @IsNumber()
  regular_hours?: number;

  @IsOptional()
  @IsNumber()
  overtime_hours?: number;

  @IsOptional()
  @IsNumber()
  double_time_hours?: number;

  @IsOptional()
  @IsEnum(PayMethod)
  pay_method?: PayMethod;
}

export class UpdatePayrollRecordDto extends PartialType(CreatePayrollRecordDto) {}

// ─── Payroll Earnings ─────────────────────────────────────────────────────────

export class CreatePayrollEarningDto {
  @IsString()
  earning_type: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  hours?: number;

  @IsOptional()
  @IsNumber()
  rate?: number;
}

// ─── Payroll Deductions ───────────────────────────────────────────────────────

export class CreatePayrollDeductionDto {
  @IsEnum(DeductionType)
  deduction_type: DeductionType;

  @IsOptional()
  @IsUUID()
  benefit_plan_id?: string;

  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsBoolean()
  is_pre_tax?: boolean;
}

// ─── Payroll Taxes ────────────────────────────────────────────────────────────

export class CreatePayrollTaxDto {
  @IsUUID()
  jurisdiction_id: string;

  @IsString()
  tax_type: string;

  @IsOptional()
  @IsNumber()
  taxable_amount?: number;

  @IsOptional()
  @IsNumber()
  tax_amount?: number;

  @IsOptional()
  @IsNumber()
  employer_tax_amount?: number;
}

// ─── Time Entries ─────────────────────────────────────────────────────────────

export class CreateTimeEntryDto {
  @IsUUID()
  employee_id: string;

  @IsDateString()
  entry_date: string;

  @IsString()
  start_time: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsNumber()
  regular_hours?: number;

  @IsOptional()
  @IsNumber()
  overtime_hours?: number;

  @IsOptional()
  @IsNumber()
  double_time_hours?: number;

  @IsOptional()
  @IsNumber()
  break_minutes?: number;

  @IsOptional()
  @IsString()
  pay_code?: string;

  @IsOptional()
  @IsString()
  project_code?: string;

  @IsOptional()
  @IsString()
  task_description?: string;
}

export class UpdateTimeEntryDto extends PartialType(CreateTimeEntryDto) {}

// ─── Payroll Adjustments ──────────────────────────────────────────────────────

export class CreatePayrollAdjustmentDto {
  @IsOptional()
  @IsUUID()
  original_payroll_record_id?: string;

  @IsString()
  adjustment_type: string;

  @IsString()
  reason: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  effective_date: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

// ─── Payroll Reports ──────────────────────────────────────────────────────────

export class CreatePayrollReportDto {
  @IsString()
  report_type: string;

  @IsString()
  reporting_period: string;

  @IsDateString()
  generated_date: string;

  @IsOptional()
  @IsDateString()
  filing_deadline?: string;
}

export class UpdatePayrollReportDto extends PartialType(CreatePayrollReportDto) {
  @IsOptional()
  @IsDateString()
  filed_date?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  file_reference?: string;
}

// ─── Expense Reports ──────────────────────────────────────────────────────────

export class CreateExpenseReportDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  line_items?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  receipt_documents?: Record<string, unknown>[];

  @IsOptional()
  @IsString()
  reimbursement_method?: string;
}

export class UpdateExpenseReportDto extends PartialType(CreateExpenseReportDto) {}

export class ReviewExpenseReportDto {
  @IsEnum(ExpenseStatus)
  status: ExpenseStatus;

  @IsOptional()
  @IsString()
  rejection_reason?: string;
}
