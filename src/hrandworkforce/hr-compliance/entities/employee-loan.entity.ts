import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LoanType, LoanStatus } from '../hr-compliance.enums.js';

@Entity('employee_loans')
export class EmployeeLoan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'enum', enum: LoanType })
  loan_type: LoanType;

  // CHECK (principal > 0) enforced at DB level
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  principal: number;

  @Column({ type: 'numeric', precision: 5, scale: 4, default: 0 })
  interest_rate: number;

  // CHECK (total_repayable >= principal) enforced at DB level
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total_repayable: number;

  @Column({ type: 'date', nullable: true })
  disbursed_on: string;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'enum', enum: LoanStatus, default: LoanStatus.PENDING })
  status: LoanStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  monthly_deduction: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  remaining_balance: number;

  @Column({ type: 'date', nullable: true })
  deduction_start_date: string;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
