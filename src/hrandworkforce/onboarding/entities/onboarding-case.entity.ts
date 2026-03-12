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
import { Tenant } from '../../core/entities/tenant.entity';
import { User } from '../../core/entities/user.entity';
import { Employee } from '../../core/entities/employee.entity';
import { OnboardingTemplate } from './onboarding-template.entity';
import { OnboardingStatus } from '../onboarding.enums';

@Entity('onboarding_cases')
export class OnboardingCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: true })
  template_id: string | null;

  @ManyToOne(() => OnboardingTemplate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'template_id' })
  template: OnboardingTemplate | null;

  @Column({ type: 'uuid', nullable: true })
  applicant_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  application_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  offer_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  employee_id: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee | null;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date', nullable: true })
  target_completion_date: string | null;

  @Column({ type: 'enum', enum: OnboardingStatus, default: OnboardingStatus.Planned })
  status: OnboardingStatus;

  @Column({ type: 'uuid', nullable: true })
  workflow_instance_id: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updater: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
