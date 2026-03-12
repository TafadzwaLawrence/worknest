import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsArray,
  IsPositive,
  Min,
  MaxLength,
} from 'class-validator';
import {
  SalaryRevisionType,
  AssetStatus,
  DisciplinarySeverity,
  DisciplinaryStatus,
  PipStatus,
  NotificationType,
  LoanType,
  LoanStatus,
} from '../hr-compliance.enums.js';
import { AssetType } from '../../onboarding/onboarding.enums.js';

// ─── Salary Revisions ─────────────────────────────────────────────────────────

export class CreateSalaryRevisionDto {
  @IsUUID()
  employee_id: string;

  @IsDateString()
  effective_date: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  previous_salary?: number;

  @IsNumber()
  @Min(0)
  new_salary: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsEnum(SalaryRevisionType)
  revision_type: SalaryRevisionType;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  approved_by?: string;

  @IsOptional()
  @IsDateString()
  approved_at?: string;
}

// ─── Asset Catalog ────────────────────────────────────────────────────────────

export class CreateAssetDto {
  @IsString()
  @MaxLength(100)
  asset_tag: string;

  @IsOptional()
  @IsString()
  serial_number?: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(AssetType)
  category: AssetType;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsDateString()
  purchase_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchase_cost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsUUID()
  current_assignee_id?: string;

  @IsOptional()
  @IsUUID()
  work_location_id?: string;

  @IsOptional()
  @IsDateString()
  warranty_expiry_date?: string;

  @IsOptional()
  notes?: string;

  @IsOptional()
  depreciation_schedule?: Record<string, unknown>;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum(AssetStatus)
  current_status?: AssetStatus;

  @IsOptional()
  @IsUUID()
  current_assignee_id?: string;

  @IsOptional()
  @IsUUID()
  work_location_id?: string;

  @IsOptional()
  @IsDateString()
  warranty_expiry_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  depreciation_schedule?: Record<string, unknown>;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─── Disciplinary Cases ───────────────────────────────────────────────────────

export class CreateDisciplinaryCaseDto {
  @IsUUID()
  employee_id: string;

  @IsString()
  @MaxLength(50)
  case_number: string;

  @IsDateString()
  incident_date: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsEnum(DisciplinarySeverity)
  severity: DisciplinarySeverity;

  @IsString()
  description: string;

  @IsOptional()
  @IsUUID()
  raised_by?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateDisciplinaryCaseDto {
  @IsOptional()
  @IsEnum(DisciplinaryStatus)
  status?: DisciplinaryStatus;

  @IsOptional()
  @IsEnum(DisciplinarySeverity)
  severity?: DisciplinarySeverity;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  resolution_notes?: string;

  @IsOptional()
  @IsDateString()
  resolved_at?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class AttachDocumentDto {
  @IsUUID()
  document_id: string;
}

// ─── PIP Records ──────────────────────────────────────────────────────────────

export class CreatePipRecordDto {
  @IsUUID()
  employee_id: string;

  @IsOptional()
  @IsUUID()
  disciplinary_case_id?: string;

  @IsOptional()
  @IsUUID()
  review_cycle_id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsArray()
  objectives?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  check_in_schedule?: Record<string, unknown>[];

  @IsOptional()
  @IsUUID()
  approved_by?: string;

  @IsOptional()
  @IsDateString()
  approved_at?: string;
}

export class UpdatePipRecordDto {
  @IsOptional()
  @IsEnum(PipStatus)
  status?: PipStatus;

  @IsOptional()
  @IsString()
  progress_notes?: string;

  @IsOptional()
  @IsString()
  final_outcome?: string;

  @IsOptional()
  @IsArray()
  objectives?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  check_in_schedule?: Record<string, unknown>[];
}

// ─── User Notifications ───────────────────────────────────────────────────────

export class CreateNotificationDto {
  @IsUUID()
  user_id: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  entity_type?: string;

  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─── Employee Loans ───────────────────────────────────────────────────────────

export class CreateLoanDto {
  @IsUUID()
  employee_id: string;

  @IsEnum(LoanType)
  loan_type: LoanType;

  @IsNumber()
  @IsPositive()
  principal: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  interest_rate?: number;

  @IsNumber()
  @Min(0)
  total_repayable: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly_deduction?: number;

  @IsOptional()
  @IsDateString()
  deduction_start_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ApproveLoanDto {
  @IsUUID()
  approved_by: string;

  @IsOptional()
  @IsDateString()
  disbursed_on?: string;
}

export class CreateLoanRepaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsDateString()
  payment_date: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  balance_after?: number;

  @IsOptional()
  @IsUUID()
  payroll_record_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
