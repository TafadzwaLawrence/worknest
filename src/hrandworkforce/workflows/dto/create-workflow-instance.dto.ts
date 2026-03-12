import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { InstanceStatus } from '../entities/workflow.enums.js';

export class CreateWorkflowInstanceDto {
  @ApiProperty({ description: 'ID of the workflow template to run' })
  @IsUUID()
  workflow_id: string;

  @ApiProperty({ example: 'a1b2c3d4-...', description: 'ID of the entity being processed' })
  @IsUUID()
  entity_id: string;

  @ApiProperty({ example: 'leave_requests', description: 'Type of entity' })
  @IsString()
  @IsNotEmpty()
  entity_type: string;

  @ApiPropertyOptional({ enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' })
  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  due_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
