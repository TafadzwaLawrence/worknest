import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApprovalAction } from '../entities/workflow.enums.js';

export class ActionStepDto {
  @ApiProperty({ enum: ApprovalAction })
  @IsEnum(ApprovalAction)
  action: ApprovalAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}
