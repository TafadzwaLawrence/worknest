import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApprovalAction, StepType } from '../entities/workflow.enums.js';

export class CreateWorkflowStepDto {
  @ApiProperty({ example: 'Manager Approval' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: StepType })
  @IsEnum(StepType)
  step_type: StepType;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({ description: 'Hours before escalation triggers' })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeout_hours?: number;

  @ApiPropertyOptional({ default: 100, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  approval_threshold?: number;

  @ApiPropertyOptional({ type: [String], enum: ApprovalAction })
  @IsOptional()
  @IsArray()
  @IsEnum(ApprovalAction, { each: true })
  actions_allowed?: ApprovalAction[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;
}
