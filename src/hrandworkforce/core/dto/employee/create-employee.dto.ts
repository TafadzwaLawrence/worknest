import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import {
  EmploymentStatus,
  EmploymentType,
  GenderType,
} from '../../entities/employee.entity.js';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  last_name: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  display_name?: string;

  @ApiProperty({ example: 'EMP-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  employee_code: string;

  @ApiProperty({ example: 'john.doe@company.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'john.doe@gmail.com' })
  @IsOptional()
  @IsEmail()
  personal_email?: string;

  @ApiPropertyOptional({ example: '+263242123456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  work_phone_number?: string;

  @ApiPropertyOptional({ example: '+263771234567' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  personal_cell_number?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional({ enum: GenderType })
  @IsOptional()
  @IsEnum(GenderType)
  gender?: GenderType;

  @ApiPropertyOptional({ example: 'Zimbabwean' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  date_of_join: string;

  @ApiPropertyOptional({ example: '2024-07-15' })
  @IsOptional()
  @IsDateString()
  date_of_confirmation?: string;

  @ApiPropertyOptional({ enum: EmploymentType, default: EmploymentType.FULL_TIME })
  @IsOptional()
  @IsEnum(EmploymentType)
  employment_type?: EmploymentType;

  @ApiPropertyOptional({ enum: EmploymentStatus, default: EmploymentStatus.ACTIVE })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  employment_status?: EmploymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  department_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  designation_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  work_location_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  reporting_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  matrix_manager_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  base_salary?: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  salary_currency?: string;

  @ApiPropertyOptional({ example: 'monthly', default: 'monthly' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  pay_frequency?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requires_system_access?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_contractor?: boolean;
}
