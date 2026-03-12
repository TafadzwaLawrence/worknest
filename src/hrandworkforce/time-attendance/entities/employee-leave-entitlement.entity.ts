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
import { LeaveType } from './leave-type.entity';
import { LeavePeriod } from './leave-period.entity';

@Entity('employee_leave_entitlements')
@Unique(['employee_id', 'leave_type_id', 'leave_period_id'])
export class EmployeeLeaveEntitlement {
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

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  entitled_days: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  accrued_days: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  used_days: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  carried_over_days: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  adjustment_days: number;

  // GENERATED ALWAYS AS ... STORED — read-only
  @Column({ type: 'decimal', precision: 5, scale: 2, insert: false, update: false, nullable: true })
  balance_days: number | null;

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
