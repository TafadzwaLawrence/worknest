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
import { ScheduledShift } from './scheduled-shift.entity';
import { ApprovalStatus } from '../time-attendance.enums';

@Entity('shift_swaps')
export class ShiftSwap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  original_shift_id: string;

  @ManyToOne(() => ScheduledShift, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'original_shift_id' })
  originalShift: ScheduledShift;

  @Column({ type: 'uuid' })
  original_employee_id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'original_employee_id' })
  originalEmployee: Employee;

  @Column({ type: 'uuid' })
  requested_employee_id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requested_employee_id' })
  requestedEmployee: Employee;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.Pending })
  status: ApprovalStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approver: Employee | null;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date | null;

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
