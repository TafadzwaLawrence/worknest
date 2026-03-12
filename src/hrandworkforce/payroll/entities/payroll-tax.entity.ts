import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('payroll_taxes')
@Unique(['tenant_id', 'payroll_record_id', 'jurisdiction_id', 'tax_type'])
export class PayrollTax {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  payroll_record_id: string;

  @Column({ type: 'uuid' })
  jurisdiction_id: string;

  @Column({ type: 'text' })
  tax_type: string; // 'federal_income', 'social_security', 'medicare', 'state_income'

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  taxable_amount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  tax_amount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  employer_tax_amount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
