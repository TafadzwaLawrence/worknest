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
import { Schedule } from './schedule.entity';
import { ShiftTemplate } from './shift-template.entity';
import { AttendanceRecord } from './attendance-record.entity';
import { ShiftStatus } from '../time-attendance.enums';

@Entity('scheduled_shifts')
export class ScheduledShift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  schedule_id: string;

  @ManyToOne(() => Schedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

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
  shift_date: string;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'timestamptz' })
  end_time: Date;

  @Column({ type: 'interval', nullable: true })
  break_duration: string | null;

  @Column({ type: 'enum', enum: ShiftStatus, default: ShiftStatus.Scheduled })
  status: ShiftStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: false })
  is_approved: boolean;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approver: Employee | null;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  actual_attendance_id: string | null;

  @ManyToOne(() => AttendanceRecord, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actual_attendance_id' })
  actualAttendance: AttendanceRecord | null;

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
