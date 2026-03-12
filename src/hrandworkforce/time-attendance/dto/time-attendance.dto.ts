import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsEnum,
  IsNumber,
  IsDateString,
  IsObject,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AttendanceStatus,
  LeaveRequestStatus,
  TimesheetStatus,
  ScheduleStatus,
  ShiftStatus,
  ApprovalStatus,
  LeaveAccrualType,
  CorrectionType,
} from '../time-attendance.enums';

// ─── Shift Templates ──────────────────────────────────────────────────────────

export class CreateShiftTemplateDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() start_time: string;
  @ApiProperty() @IsString() end_time: string;
  @ApiPropertyOptional() @IsOptional() @IsString() break_duration?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() break_rules?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_night_shift?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class UpdateShiftTemplateDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() start_time?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() end_time?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

// ─── Attendance Rules ─────────────────────────────────────────────────────────

export class CreateAttendanceRuleDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() rules?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsObject() applicability?: Record<string, unknown>;
  @ApiProperty() @IsDateString() effective_from: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effective_to?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

// ─── Attendance Records ───────────────────────────────────────────────────────

export class ClockInDto {
  @ApiProperty() @IsUUID() employee_id: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() shift_template_id?: string;
  @ApiProperty() @IsDateString() record_date: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() clock_in_location?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsObject() device_info?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() ip_address?: string;
}

export class ClockOutDto {
  @ApiPropertyOptional() @IsOptional() @IsObject() clock_out_location?: Record<string, unknown>;
}

export class UpdateAttendanceRecordDto {
  @ApiPropertyOptional({ enum: AttendanceStatus }) @IsOptional() @IsEnum(AttendanceStatus) status?: AttendanceStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_verified?: boolean;
}

// ─── Attendance Corrections ───────────────────────────────────────────────────

export class CreateAttendanceCorrectionDto {
  @ApiProperty() @IsUUID() attendance_record_id: string;
  @ApiProperty({ enum: CorrectionType }) @IsEnum(CorrectionType) correction_type: CorrectionType;
  @ApiProperty() @IsObject() original_data: Record<string, unknown>;
  @ApiProperty() @IsObject() requested_data: Record<string, unknown>;
  @ApiProperty() @IsString() reason: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() supporting_documents?: Record<string, unknown>;
}

export class ReviewCorrectionDto {
  @ApiProperty({ enum: ApprovalStatus }) @IsEnum(ApprovalStatus) status: ApprovalStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() approval_comments?: string;
}

// ─── Leave Types ──────────────────────────────────────────────────────────────

export class CreateLeaveTypeDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() code: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_paid?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requires_approval?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requires_document?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() max_consecutive_days?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() min_notice_days?: number;
  @ApiPropertyOptional({ enum: LeaveAccrualType }) @IsOptional() @IsEnum(LeaveAccrualType) accrual_type?: LeaveAccrualType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() accrual_rate?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() carry_over_enabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() max_carry_over?: number;
  @ApiPropertyOptional() @IsOptional() @IsObject() eligibility_rules?: Record<string, unknown>;
}

export class UpdateLeaveTypeDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_paid?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() accrual_rate?: number;
}

// ─── Leave Periods ────────────────────────────────────────────────────────────

export class CreateLeavePeriodDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsDateString() start_date: string;
  @ApiProperty() @IsDateString() end_date: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_current?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() accrual_settings?: Record<string, unknown>;
}

export class UpdateLeavePeriodDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_current?: boolean;
}

// ─── Leave Entitlements ───────────────────────────────────────────────────────

export class CreateLeaveEntitlementDto {
  @ApiProperty() @IsUUID() employee_id: string;
  @ApiProperty() @IsUUID() leave_type_id: string;
  @ApiProperty() @IsUUID() leave_period_id: string;
  @ApiProperty() @IsNumber() entitled_days: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() carried_over_days?: number;
}

export class AdjustLeaveEntitlementDto {
  @ApiProperty() @IsNumber() adjustment_days: number;
}

// ─── Leave Requests ───────────────────────────────────────────────────────────

export class CreateLeaveRequestDto {
  @ApiProperty() @IsUUID() leave_type_id: string;
  @ApiProperty() @IsUUID() leave_period_id: string;
  @ApiProperty() @IsDateString() start_date: string;
  @ApiProperty() @IsDateString() end_date: string;
  @ApiPropertyOptional() @IsOptional() @IsString() start_period?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() end_period?: string;
  @ApiProperty() @IsNumber() @IsPositive() total_days: number;
  @ApiProperty() @IsString() reason: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_emergency?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUUID() cover_employee_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cover_work_arrangements?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() emergency_contact?: Record<string, unknown>;
}

export class UpdateLeaveRequestStatusDto {
  @ApiProperty({ enum: LeaveRequestStatus }) @IsEnum(LeaveRequestStatus) status: LeaveRequestStatus;
}

export class ApproveLeaveRequestDto {
  @ApiProperty({ enum: ApprovalStatus }) @IsEnum(ApprovalStatus) status: ApprovalStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() comments?: string;
}

// ─── Holidays ─────────────────────────────────────────────────────────────────

export class CreateHolidayDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsDateString() date: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_recurring?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_half_day?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() half_day_period?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() applicable_to?: Record<string, unknown>;
}

export class UpdateHolidayDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() date?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_recurring?: boolean;
}

// ─── Schedules ────────────────────────────────────────────────────────────────

export class CreateScheduleDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsDateString() period_start_date: string;
  @ApiProperty() @IsDateString() period_end_date: string;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ enum: ScheduleStatus }) @IsOptional() @IsEnum(ScheduleStatus) status?: ScheduleStatus;
}

// ─── Scheduled Shifts ─────────────────────────────────────────────────────────

export class CreateScheduledShiftDto {
  @ApiProperty() @IsUUID() employee_id: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() shift_template_id?: string;
  @ApiProperty() @IsDateString() shift_date: string;
  @ApiProperty() @IsDateString() start_time: string;
  @ApiProperty() @IsDateString() end_time: string;
  @ApiPropertyOptional() @IsOptional() @IsString() break_duration?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateShiftStatusDto {
  @ApiProperty({ enum: ShiftStatus }) @IsEnum(ShiftStatus) status: ShiftStatus;
}

// ─── Shift Swaps ──────────────────────────────────────────────────────────────

export class CreateShiftSwapDto {
  @ApiProperty() @IsUUID() original_shift_id: string;
  @ApiProperty() @IsUUID() requested_employee_id: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class ReviewSwapDto {
  @ApiProperty({ enum: ApprovalStatus }) @IsEnum(ApprovalStatus) status: ApprovalStatus;
}

// ─── Time Off Requests ────────────────────────────────────────────────────────

export class CreateTimeOffRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() schedule_id?: string;
  @ApiProperty() @IsDateString() start_date: string;
  @ApiProperty() @IsDateString() end_date: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class ReviewTimeOffDto {
  @ApiProperty({ enum: ApprovalStatus }) @IsEnum(ApprovalStatus) status: ApprovalStatus;
}

// ─── Timesheets ───────────────────────────────────────────────────────────────

export class CreateTimesheetDto {
  @ApiProperty() @IsUUID() employee_id: string;
  @ApiProperty() @IsDateString() period_start_date: string;
  @ApiProperty() @IsDateString() period_end_date: string;
  @ApiProperty() @IsObject() attendance_summary: Record<string, unknown>;
  @ApiProperty() @IsObject() leave_summary: Record<string, unknown>;
  @ApiProperty() @IsObject() holiday_summary: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsObject() adjustments?: Record<string, unknown>;
}

export class UpdateTimesheetStatusDto {
  @ApiProperty({ enum: TimesheetStatus }) @IsEnum(TimesheetStatus) status: TimesheetStatus;
}

// ─── Overtime Requests ────────────────────────────────────────────────────────

export class CreateOvertimeRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() schedule_id?: string;
  @ApiProperty() @IsDateString() date: string;
  @ApiProperty() @IsDateString() start_time: string;
  @ApiProperty() @IsDateString() end_time: string;
  @ApiProperty() @IsString() reason: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) @Max(5) overtime_rate?: number;
}

export class ReviewOvertimeDto {
  @ApiProperty({ enum: ApprovalStatus }) @IsEnum(ApprovalStatus) status: ApprovalStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() calculated_amount?: number;
}
