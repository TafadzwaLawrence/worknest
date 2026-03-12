import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { InterviewStatus } from '../entities/recruitment.enums.js';

export class CreateInterviewDto {
  @ApiProperty()
  @IsUUID()
  application_id: string;

  @ApiProperty()
  @IsString()
  start_at: string;

  @ApiProperty()
  @IsString()
  end_at: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agenda?: string;
}

export class UpdateInterviewDto {
  @ApiPropertyOptional({ enum: InterviewStatus })
  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancelled_reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  start_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  end_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agenda?: string;
}

export class AddInterviewerDto {
  @ApiProperty()
  @IsUUID()
  user_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  is_primary?: boolean;
}
