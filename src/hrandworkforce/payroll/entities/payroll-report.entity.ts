import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payroll_reports')
export class PayrollReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  report_type: string; // '941', 'w2', 'w3', 'state_unemployment'

  @Column({ type: 'text' })
  reporting_period: string;

  @Column({ type: 'date' })
  generated_date: string;

  @Column({ type: 'date', nullable: true })
  filing_deadline: string;

  @Column({ type: 'date', nullable: true })
  filed_date: string;

  @Column({ type: 'text', default: 'draft' })
  status: string; // 'draft', 'generated', 'filed'

  @Column({ type: 'text', nullable: true })
  file_reference: string;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  total_wages: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  total_taxes: number;

  @Column({ type: 'int', default: 0 })
  employee_count: number;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
