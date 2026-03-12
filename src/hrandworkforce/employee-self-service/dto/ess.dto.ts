import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsObject,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { EssRequestStatus, EssAckStatus, EssOwnerType, AccessType } from '../ess.enums.js';

// ────────────── Settings / Preferences ──────────────

export class UpdateEssSettingsDto {
  @IsOptional()
  @IsObject()
  features?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  portal_branding?: Record<string, unknown>;
}

export class UpsertPortalPreferencesDto {
  @IsUUID()
  employee_id: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  notifications?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  theme?: Record<string, unknown>;
}

// ────────────── Profile Requests ──────────────

export class CreateProfileRequestDto {
  @IsUUID()
  employee_id: string;

  @IsString()
  request_type: string;

  @IsObject()
  requested_changes: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  effective_date?: string;

  @IsOptional()
  @IsUUID()
  workflow_instance_id?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ReviewProfileRequestDto {
  @IsEnum(EssRequestStatus)
  status: EssRequestStatus;

  @IsOptional()
  @IsString()
  review_comments?: string;

  @IsOptional()
  @IsDateString()
  effective_date?: string;
}

export class AddProfileRequestItemDto {
  @IsUUID()
  request_id: string;

  @IsString()
  field_path: string;

  @IsOptional()
  @IsObject()
  old_value?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  new_value?: Record<string, unknown>;
}

// ────────────── Time-Off ──────────────

export class SaveTimeOffDraftDto {
  @IsUUID()
  employee_id: string;

  @IsObject()
  draft_data: Record<string, unknown>;
}

export class CreateTimeOffPortalDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  leave_request_id: string;

  @IsOptional()
  @IsString()
  submitted_from?: string;

  @IsOptional()
  @IsObject()
  attachments?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  notes?: string;
}

// ────────────── Documents & Acknowledgments ──────────────

export class CreateRequiredAcknowledgmentDto {
  @IsUUID()
  document_id: string;

  @IsOptional()
  @IsDateString()
  effective_from?: string;

  @IsOptional()
  @IsDateString()
  effective_to?: string;

  @IsOptional()
  @IsObject()
  target?: Record<string, unknown>;
}

export class AcknowledgeDocumentDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  document_id: string;

  @IsOptional()
  @IsString()
  ack_version?: string;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class WaiveAcknowledgmentDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  document_id: string;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class LogDocumentAccessDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  document_id: string;

  @IsEnum(AccessType)
  access: AccessType;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}

// ────────────── Attachments ──────────────

export class AddAttachmentDto {
  @IsEnum(EssOwnerType)
  owner_type: EssOwnerType;

  @IsUUID()
  owner_id: string;

  @IsUUID()
  document_id: string;
}
