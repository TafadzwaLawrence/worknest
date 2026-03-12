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
import { Employee } from '../../core/entities/employee.entity';
import { TimesheetStatus } from '../time-attendance.enums';

@Entity('timesheets')
@Unique(['employee_id', 'period_start_date', 'period_end_date'])
export class Timesheet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'date' })
  period_start_date: string;

  @Column({ type: 'date' })
  period_end_date: string;

  @Column({ type: 'enum', enum: TimesheetStatus, default: TimesheetStatus.Draft })
  status: TimesheetStatus;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  total_regular_hours: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  total_overtime_hours: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  total_break_hours: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  total_leave_hours: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  total_holiday_hours: number;

  @Column({ type: 'jsonb' })
  attendance_summary: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  leave_summary: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  holiday_summary: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  adjustments: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  approval_workflow: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approver: Employee | null;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  processed_by: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'processed_by' })
  processor: Employee | null;

  @Column({ type: 'timestamptz', nullable: true })
  processed_at: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  payroll_id: string | null;

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
