import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { WorkflowStatus } from '../entities/workflow.enums.js';

export class CreateWorkflowDto {
  @ApiProperty({ example: 'Leave Approval' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'leave', description: 'e.g. recruitment, onboarding, leave, expense' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'leave_requests', description: 'Entity table/type this workflow manages' })
  @IsString()
  @IsNotEmpty()
  entity_type: string;

  @ApiPropertyOptional({ enum: WorkflowStatus, default: WorkflowStatus.DRAFT })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
