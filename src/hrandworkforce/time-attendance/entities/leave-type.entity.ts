import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity';
import { LeaveAccrualType } from '../time-attendance.enums';

@Entity('leave_types')
@Unique(['tenant_id', 'code'])
export class LeaveType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 7, default: '#3498db' })
  color: string;

  @Column({ type: 'boolean', default: true })
  is_paid: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: true })
  requires_approval: boolean;

  @Column({ type: 'boolean', default: false })
  requires_document: boolean;

  @Column({ type: 'int', nullable: true })
  max_consecutive_days: number | null;

  @Column({ type: 'int', default: 1 })
  min_notice_days: number;

  @Column({ type: 'int', nullable: true })
  max_advance_days: number | null;

  @Column({ type: 'enum', enum: LeaveAccrualType, default: LeaveAccrualType.Annual })
  accrual_type: LeaveAccrualType;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  accrual_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  max_accrual: number | null;

  @Column({ type: 'boolean', default: false })
  carry_over_enabled: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  max_carry_over: number | null;

  @Column({ type: 'boolean', default: false })
  payout_on_termination: boolean;

  @Column({ type: 'jsonb', default: {} })
  eligibility_rules: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  approval_workflow: Record<string, unknown>;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
