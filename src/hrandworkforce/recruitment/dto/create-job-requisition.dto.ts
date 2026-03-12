import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { JobStatus } from '../entities/recruitment.enums.js';

export class CreateJobRequisitionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference_code?: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employment_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hiring_manager_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  recruiter_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  headcount?: number;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  compensation_range?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
