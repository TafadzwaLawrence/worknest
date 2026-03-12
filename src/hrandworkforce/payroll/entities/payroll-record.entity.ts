import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { PayrollStatus, PayMethod } from '../payroll.enums.js';

@Entity('payroll_records')
@Unique(['tenant_id', 'payroll_run_id', 'employee_id'])
export class PayrollRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  payroll_run_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid' })
  pay_period_id: string;

  @Column({ type: 'numeric', precision: 6, scale: 2, default: 0 })
  regular_hours: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, default: 0 })
  overtime_hours: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, default: 0 })
  double_time_hours: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  regular_pay: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  overtime_pay: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  double_time_pay: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  gross_pay: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  net_pay: number;

  @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.DRAFT })
  status: PayrollStatus;

  @Column({ type: 'enum', enum: PayMethod, nullable: true })
  pay_method: PayMethod;

  // SECURITY: PII — must be encrypted at application layer before storage
  @Column({ type: 'jsonb', nullable: true })
  bank_account_info: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  check_number: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
