import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { NoteVisibility } from '../entities/recruitment.enums.js';

export class CreatePipelineDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreatePipelineStageDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requires_assessment?: boolean;
}

export class CreateNoteDto {
  @ApiProperty()
  @IsString()
  parent_type: string;

  @ApiProperty()
  @IsString()
  parent_id: string;

  @ApiPropertyOptional({ enum: NoteVisibility })
  @IsOptional()
  @IsEnum(NoteVisibility)
  visibility?: NoteVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;
}

export class CreateTagDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateEvaluationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  application_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  applicant_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interview_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  criteria?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  passed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}
