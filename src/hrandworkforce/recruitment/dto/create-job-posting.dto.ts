import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateJobPostingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  requisition_id?: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  full_description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_remote?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employment_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  compensation_range?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_published?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publish_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expire_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apply_url?: string;
}
