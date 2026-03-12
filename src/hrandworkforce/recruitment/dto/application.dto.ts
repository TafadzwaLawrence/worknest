import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApplicantContactType } from '../entities/recruitment.enums.js';

export class CreateApplicantContactDto {
  @ApiProperty({ enum: ApplicantContactType })
  @IsEnum(ApplicantContactType)
  type: ApplicantContactType;

  @ApiProperty()
  @IsString()
  value: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_preferred?: boolean;
}

export class CreateApplicationDto {
  @ApiProperty()
  @IsUUID()
  applicant_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  job_posting_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  requisition_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  pipeline_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  stage_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;
}

export class UpdateApplicationStatusDto {
  @ApiProperty()
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  stage_id?: string;
}
