import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity';
import { Employee } from '../../core/entities/employee.entity';
import { LeaveType } from './leave-type.entity';
import { LeavePeriod } from './leave-period.entity';
import { LeaveRequestStatus } from '../time-attendance.enums';

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'uuid' })
  leave_type_id: string;

  @ManyToOne(() => LeaveType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leave_type_id' })
  leaveType: LeaveType;

  @Column({ type: 'uuid' })
  leave_period_id: string;

  @ManyToOne(() => LeavePeriod, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leave_period_id' })
  leavePeriod: LeavePeriod;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ type: 'varchar', length: 10, default: 'full_day' })
  start_period: string;

  @Column({ type: 'varchar', length: 10, default: 'full_day' })
  end_period: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  total_days: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'jsonb', nullable: true })
  emergency_contact: Record<string, unknown> | null;

  @Column({ type: 'enum', enum: LeaveRequestStatus, default: LeaveRequestStatus.Pending })
  status: LeaveRequestStatus;

  @Column({ type: 'uuid', nullable: true })
  current_approver_id: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'current_approver_id' })
  currentApprover: Employee | null;

  @Column({ type: 'jsonb', nullable: true })
  approval_workflow: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  documents: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false })
  is_emergency: boolean;

  @Column({ type: 'uuid', nullable: true })
  cover_employee_id: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cover_employee_id' })
  coverEmployee: Employee | null;

  @Column({ type: 'text', nullable: true })
  cover_work_arrangements: string | null;

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
