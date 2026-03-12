import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

// Append-only: no updated_at, no deleted_at
// CHECK (amount > 0) enforced at DB level
@Entity('loan_repayments')
export class LoanRepayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  loan_id: string;

  @Column({ type: 'uuid', nullable: true })
  payroll_record_id: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  payment_date: string;

  @Column({ type: 'text', default: 'payroll_deduction' })
  payment_method: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  balance_after: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
