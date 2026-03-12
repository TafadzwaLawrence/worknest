import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Acme Corporation Ltd' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legal_name?: string;

  @ApiProperty({ example: 'acme' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subdomain: string;

  @ApiPropertyOptional({ example: 'Africa/Harare', default: 'UTC' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiProperty({ example: 'ZW' })
  @IsString()
  @Length(2, 2)
  country_code: string;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  business_language?: string;

  @ApiPropertyOptional({ example: 'sn', default: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  indiginous_language?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  fiscal_year_start?: string;

  @ApiPropertyOptional({ example: 'hr@acme.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  contact_email?: string;

  @ApiPropertyOptional({ example: '+263242123456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contact_phone?: string;

  @ApiPropertyOptional({ example: '+263771234567' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cell_phone_number?: string;

  @ApiPropertyOptional({ example: 'https://acme.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ example: { street: '1 Main St', city: 'Harare' } })
  @IsOptional()
  @IsObject()
  address?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'TAX-123456' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tax_id?: string;

  @ApiPropertyOptional({ example: 'VAT-789012' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  vat_registration_number?: string;

  @ApiPropertyOptional({ example: 'BP-345678' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bp_number?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
