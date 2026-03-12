import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity.js';

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  TEMPORARY = 'temporary',
  INTERN = 'intern',
  FREELANCE = 'freelance',
}

export enum EmploymentStatus {
  ACTIVE = 'active',
  PROBATION = 'probation',
  SUSPENDED = 'suspended',
  LEAVE_OF_ABSENCE = 'leave_of_absence',
  TERMINATED = 'terminated',
  RESIGNED = 'resigned',
}

export enum GenderType {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
  OTHER = 'other',
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  first_name: string;

  @Column({ type: 'varchar', length: 255 })
  last_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  display_name: string;

  @Column({ type: 'varchar', length: 255 })
  employee_code: string;

  @Column({ type: 'citext' })
  email: string;

  @Column({ type: 'citext', nullable: true })
  personal_email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  work_phone_number: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  personal_cell_number: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ type: 'enum', enum: GenderType, nullable: true })
  gender: GenderType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality: string;

  @Column({ type: 'date' })
  date_of_join: Date;

  @Column({ type: 'date', nullable: true })
  date_of_confirmation: Date;

  @Column({ type: 'date', nullable: true })
  date_of_exit: Date;

  @Column({ type: 'enum', enum: EmploymentType, default: EmploymentType.FULL_TIME })
  employment_type: EmploymentType;

  @Column({ type: 'enum', enum: EmploymentStatus, default: EmploymentStatus.ACTIVE })
  employment_status: EmploymentStatus;

  @Column({ type: 'uuid', nullable: true })
  department_id: string;

  @Column({ type: 'uuid', nullable: true })
  designation_id: string;

  @Column({ type: 'uuid', nullable: true })
  work_location_id: string;

  @Column({ type: 'uuid', nullable: true })
  reporting_to: string;

  @Column({ type: 'uuid', nullable: true })
  matrix_manager_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  base_salary: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  salary_currency: string;

  @Column({ type: 'varchar', length: 20, default: 'monthly' })
  pay_frequency: string;

  // SECURITY: PII — bank account data must be encrypted at the application layer before storage
  @Column({ type: 'jsonb', nullable: true })
  bank_account: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  system_user_id: string;

  @Column({ type: 'boolean', default: false })
  requires_system_access: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_contractor: boolean;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
