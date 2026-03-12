import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { DocStatus, DocOwnerType, RetentionAction } from '../entities/document-management.enums.js';

// ─── Storage Location ────────────────────────────────────────────────────────

export class CreateStorageLocationDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  provider: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bucket?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  base_path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  encryption_enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  kms_key_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

// ─── Document ────────────────────────────────────────────────────────────────

export class CreateDocumentDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  @IsString()
  storage_key: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  storage_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  file_ext?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  content_size?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checksum?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  extracted_text?: string;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: DocStatus })
  @IsOptional()
  @IsEnum(DocStatus)
  status?: DocStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  extracted_text?: string;
}

export class LinkDocumentDto {
  @ApiProperty({ enum: DocOwnerType })
  @IsEnum(DocOwnerType)
  owner_type: DocOwnerType;

  @ApiProperty()
  @IsUUID()
  owner_id: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export class CreateDocumentCategoryDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export class CreateDocumentTagDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;
}

// ─── Retention ───────────────────────────────────────────────────────────────

export class CreateRetentionPolicyDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  applies_to: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tag_id?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  retain_for_months: number;

  @ApiPropertyOptional({ enum: RetentionAction })
  @IsOptional()
  @IsEnum(RetentionAction)
  action?: RetentionAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  legal_hold?: boolean;
}

export class SetDocumentRetentionDto {
  @ApiProperty()
  @IsUUID()
  policy_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  next_review_at?: string;

  @ApiPropertyOptional({ enum: RetentionAction })
  @IsOptional()
  @IsEnum(RetentionAction)
  next_action?: RetentionAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  legal_hold?: boolean;
}

// ─── ACL ─────────────────────────────────────────────────────────────────────

export class CreateDocumentAclDto {
  @ApiProperty()
  @IsString()
  principal_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  principal_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  can_read?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  can_write?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  can_delete?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  can_share?: boolean;
}

// ─── Share ───────────────────────────────────────────────────────────────────

export class CreateDocumentShareDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expires_at?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  allowed_actions?: string[];
}
