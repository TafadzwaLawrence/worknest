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
import { OffboardingTemplate } from './offboarding-template.entity';
import { OffboardingStatus } from '../onboarding.enums';

@Entity('offboarding_cases')
export class OffboardingCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: true })
  template_id: string | null;

  @ManyToOne(() => OffboardingTemplate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'template_id' })
  template: OffboardingTemplate | null;

  @Column({ type: 'uuid' })
  employee_id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'uuid', nullable: true })
  initiator_user_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'initiator_user_id' })
  initiator: User | null;

  @Column({ type: 'text', nullable: true })
  exit_type: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'date' })
  last_working_day: string;

  @Column({ type: 'boolean', default: true })
  rehire_eligible: boolean;

  @Column({ type: 'enum', enum: OffboardingStatus, default: OffboardingStatus.Planned })
  status: OffboardingStatus;

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
