import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { TaxFilingStatus } from '../payroll.enums.js';

@Entity('employee_tax_info')
@Unique(['tenant_id', 'employee_id'])
export class EmployeeTaxInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'enum', enum: TaxFilingStatus, nullable: true })
  filing_status: TaxFilingStatus;

  @Column({ type: 'int', default: 0 })
  allowances: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  additional_withholding: number;

  @Column({ type: 'boolean', default: false })
  exempt_federal: boolean;

  @Column({ type: 'boolean', default: false })
  exempt_state: boolean;

  @Column({ type: 'boolean', default: false })
  exempt_local: boolean;

  // SECURITY: PII — must be encrypted at application layer before storage
  @Column({ type: 'text', nullable: true })
  social_security_number: string;

  @Column({ type: 'jsonb', nullable: true })
  w4_certificate: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  state_withholding_cert: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
