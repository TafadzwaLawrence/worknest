import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { DeductionType } from '../payroll.enums.js';

@Entity('payroll_deductions')
export class PayrollDeduction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  payroll_record_id: string;

  @Column({ type: 'enum', enum: DeductionType })
  deduction_type: DeductionType;

  @Column({ type: 'uuid', nullable: true })
  benefit_plan_id: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'boolean', default: false })
  is_pre_tax: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
