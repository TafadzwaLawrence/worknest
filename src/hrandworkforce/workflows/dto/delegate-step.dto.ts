import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class DelegateStepDto {
  @ApiProperty({ description: 'User ID to delegate to' })
  @IsUUID()
  delegated_to: string;

  @ApiProperty({ example: '2026-03-12T08:00:00Z' })
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional({ example: '2026-03-20T08:00:00Z' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
