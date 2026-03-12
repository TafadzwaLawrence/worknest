import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('payroll_earnings')
export class PayrollEarning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  payroll_record_id: string;

  @Column({ type: 'text' })
  earning_type: string; // 'bonus', 'commission', 'reimbursement'

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  hours: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  rate: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
