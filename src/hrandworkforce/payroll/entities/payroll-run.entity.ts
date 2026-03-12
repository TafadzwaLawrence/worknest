import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { PayrollStatus } from '../payroll.enums.js';

@Entity('payroll_runs')
@Unique(['tenant_id', 'pay_period_id', 'run_number'])
export class PayrollRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  pay_period_id: string;

  @Column({ type: 'int', default: 1 })
  run_number: number;

  @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.DRAFT })
  status: PayrollStatus;

  @Column({ type: 'uuid', nullable: true })
  processed_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  processed_at: Date;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  total_gross: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  total_net: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  total_taxes: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  total_deductions: number;

  @Column({ type: 'int', default: 0 })
  employee_count: number;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
