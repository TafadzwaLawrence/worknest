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
import { ShiftTemplate } from './shift-template.entity';
import { AttendanceStatus } from '../time-attendance.enums';

@Entity('attendance_records')
@Unique(['employee_id', 'record_date'])
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'uuid', nullable: true })
  shift_template_id: string | null;

  @ManyToOne(() => ShiftTemplate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shift_template_id' })
  shiftTemplate: ShiftTemplate | null;

  @Column({ type: 'date' })
  record_date: string;

  @Column({ type: 'timestamptz', nullable: true })
  scheduled_start_time: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  scheduled_end_time: Date | null;

  @Column({ type: 'interval', nullable: true })
  scheduled_break_duration: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  actual_clock_in: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  actual_clock_out: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  break_start: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  break_end: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  clock_in_location: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  clock_out_location: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  device_info: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.Present })
  status: AttendanceStatus;

  @Column({ type: 'interval', nullable: true })
  hours_worked: string | null;

  @Column({ type: 'interval', nullable: true })
  regular_hours: string | null;

  @Column({ type: 'interval', nullable: true })
  overtime_hours: string | null;

  @Column({ type: 'interval', nullable: true })
  break_duration: string | null;

  @Column({ type: 'int', default: 0 })
  late_minutes: number;

  @Column({ type: 'int', default: 0 })
  early_departure_minutes: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  normalized_hours: number | null;

  // Generated columns — read-only
  @Column({ type: 'smallint', insert: false, update: false, nullable: true })
  record_dow: number | null;

  @Column({ type: 'smallint', insert: false, update: false, nullable: true })
  record_week: number | null;

  @Column({ type: 'smallint', insert: false, update: false, nullable: true })
  record_month: number | null;

  @Column({ type: 'boolean', default: false })
  is_auto_clock_out: boolean;

  @Column({ type: 'boolean', default: false })
  requires_correction: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'uuid', nullable: true })
  verified_by: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verified_by' })
  verifiedByEmployee: Employee | null;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

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
