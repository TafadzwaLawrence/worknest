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
import { ApprovalStatus } from '../time-attendance.enums';

@Entity('overtime_requests')
export class OvertimeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'uuid', nullable: true })
  schedule_id: string | null;

  @ManyToOne(() => Schedule, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule | null;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'timestamptz' })
  end_time: Date;

  // GENERATED ALWAYS AS (end_time - start_time) STORED — read-only
  @Column({ type: 'interval', insert: false, update: false, nullable: true })
  duration: string | null;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.Pending })
  status: ApprovalStatus;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approver: Employee | null;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 1.5 })
  overtime_rate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  calculated_amount: number | null;

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
