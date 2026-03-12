import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';
import { OfferStatus } from '../entities/recruitment.enums.js';

export class CreateOfferDto {
  @ApiProperty()
  @IsUUID()
  application_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hiring_manager_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  compensation?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  benefits?: Record<string, unknown>;
}

export class UpdateOfferStatusDto {
  @ApiProperty({ enum: OfferStatus })
  @IsEnum(OfferStatus)
  status: OfferStatus;
}
