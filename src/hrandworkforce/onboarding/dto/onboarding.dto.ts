import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsEnum,
  IsNumber,
  IsDateString,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  OnboardingStatus,
  OffboardingStatus,
  TaskStatus,
  PriorityLevel,
  CaseType,
  ProvisionStatus,
  AssetType,
  NoteVisibility,
} from '../onboarding.enums';

// ─── Templates ────────────────────────────────────────────────────────────────

export class CreateOnboardingTemplateDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateOnboardingTemplateDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

export class CreateOnboardingTemplateTaskDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() relative_day_offset?: number;
  @ApiPropertyOptional({ enum: PriorityLevel }) @IsOptional() @IsEnum(PriorityLevel) priority?: PriorityLevel;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() required?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() assigned_to_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigned_to_id?: string;
}

export class CreateOffboardingTemplateDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateOffboardingTemplateDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

export class CreateOffboardingTemplateTaskDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() relative_day_offset?: number;
  @ApiPropertyOptional({ enum: PriorityLevel }) @IsOptional() @IsEnum(PriorityLevel) priority?: PriorityLevel;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() required?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() assigned_to_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigned_to_id?: string;
}

// ─── Onboarding Cases ─────────────────────────────────────────────────────────

export class CreateOnboardingCaseDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() template_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() applicant_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() application_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() offer_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() employee_id?: string;
  @ApiProperty() @IsDateString() start_date: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() target_completion_date?: string;
  @ApiPropertyOptional({ enum: OnboardingStatus }) @IsOptional() @IsEnum(OnboardingStatus) status?: OnboardingStatus;
  @ApiPropertyOptional() @IsOptional() @IsUUID() workflow_instance_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class UpdateOnboardingCaseDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() employee_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() target_completion_date?: string;
  @ApiPropertyOptional({ enum: OnboardingStatus }) @IsOptional() @IsEnum(OnboardingStatus) status?: OnboardingStatus;
  @ApiPropertyOptional() @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class CreateOnboardingCaseTaskDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() template_task_id?: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: TaskStatus }) @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @ApiPropertyOptional({ enum: PriorityLevel }) @IsOptional() @IsEnum(PriorityLevel) priority?: PriorityLevel;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignee_user_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignee_employee_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() due_date?: string;
}

export class UpdateOnboardingCaseTaskDto {
  @ApiPropertyOptional({ enum: TaskStatus }) @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @ApiPropertyOptional({ enum: PriorityLevel }) @IsOptional() @IsEnum(PriorityLevel) priority?: PriorityLevel;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignee_user_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignee_employee_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() due_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() blocked_reason?: string;
}

// ─── Offboarding Cases ────────────────────────────────────────────────────────

export class CreateOffboardingCaseDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() template_id?: string;
  @ApiProperty() @IsUUID() employee_id: string;
  @ApiPropertyOptional() @IsOptional() @IsString() exit_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiProperty() @IsDateString() last_working_day: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() rehire_eligible?: boolean;
  @ApiPropertyOptional({ enum: OffboardingStatus }) @IsOptional() @IsEnum(OffboardingStatus) status?: OffboardingStatus;
  @ApiPropertyOptional() @IsOptional() @IsUUID() workflow_instance_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class UpdateOffboardingCaseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() exit_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() last_working_day?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() rehire_eligible?: boolean;
  @ApiPropertyOptional({ enum: OffboardingStatus }) @IsOptional() @IsEnum(OffboardingStatus) status?: OffboardingStatus;
  @ApiPropertyOptional() @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class CreateOffboardingCaseTaskDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() template_task_id?: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: TaskStatus }) @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @ApiPropertyOptional({ enum: PriorityLevel }) @IsOptional() @IsEnum(PriorityLevel) priority?: PriorityLevel;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignee_user_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignee_employee_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() due_date?: string;
}

export class UpdateOffboardingCaseTaskDto {
  @ApiPropertyOptional({ enum: TaskStatus }) @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @ApiPropertyOptional({ enum: PriorityLevel }) @IsOptional() @IsEnum(PriorityLevel) priority?: PriorityLevel;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignee_user_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignee_employee_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() due_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() blocked_reason?: string;
}

// ─── Provisioning & Assets ───────────────────────────────────────────────────

export class CreateProvisioningRequestDto {
  @ApiProperty({ enum: CaseType }) @IsEnum(CaseType) case_type: CaseType;
  @ApiProperty() @IsUUID() case_id: string;
  @ApiProperty() @IsString() request_type: string;
  @ApiPropertyOptional() @IsOptional() @IsString() target_system?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() requested_for_employee_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() details?: Record<string, unknown>;
}

export class UpdateProvisioningStatusDto {
  @ApiProperty({ enum: ProvisionStatus }) @IsEnum(ProvisionStatus) status: ProvisionStatus;
}

export class CreateAssetAssignmentDto {
  @ApiProperty() @IsUUID() employee_id: string;
  @ApiPropertyOptional({ enum: CaseType }) @IsOptional() @IsEnum(CaseType) case_type?: CaseType;
  @ApiPropertyOptional() @IsOptional() @IsUUID() case_id?: string;
  @ApiProperty({ enum: AssetType }) @IsEnum(AssetType) asset_type: AssetType;
  @ApiPropertyOptional() @IsOptional() @IsString() asset_tag?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serial_number?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() due_return_at?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class ReturnAssetDto {
  @ApiProperty() @IsDateString() returned_at: string;
  @ApiPropertyOptional() @IsOptional() @IsString() condition_on_return?: string;
}

// ─── Exit & Knowledge Transfer ───────────────────────────────────────────────

export class CreateExitInterviewDto {
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduled_at?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() interviewer_user_id?: string;
}

export class UpdateExitInterviewDto {
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduled_at?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() interviewer_user_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() interviewer_notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) @Max(5) rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() completed_at?: string;
}

export class CreateKnowledgeTransferDto {
  @ApiProperty() @IsUUID() from_employee_id: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() to_employee_id?: string;
  @ApiProperty() @IsString() subject: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() due_date?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateClearanceItemDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() department_id?: string;
  @ApiProperty() @IsString() item_name: string;
  @ApiPropertyOptional({ enum: TaskStatus }) @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @ApiPropertyOptional() @IsOptional() @IsDateString() due_date?: string;
}

export class UpdateClearanceItemDto {
  @ApiPropertyOptional({ enum: TaskStatus }) @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() completed_at?: string;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export class CreateOnboardingNoteDto {
  @ApiPropertyOptional({ enum: NoteVisibility }) @IsOptional() @IsEnum(NoteVisibility) visibility?: NoteVisibility;
  @ApiPropertyOptional() @IsOptional() @IsString() body?: string;
}

export class CreateOffboardingNoteDto {
  @ApiPropertyOptional({ enum: NoteVisibility }) @IsOptional() @IsEnum(NoteVisibility) visibility?: NoteVisibility;
  @ApiPropertyOptional() @IsOptional() @IsString() body?: string;
}
