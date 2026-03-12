import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ExpenseStatus } from '../payroll.enums.js';

@Entity('expense_reports')
export class ExpenseReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', default: 'USD' })
  currency: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.DRAFT })
  status: ExpenseStatus;

  @Column({ type: 'timestamptz', nullable: true })
  submitted_at: Date;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paid_at: Date;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ type: 'jsonb', default: [] })
  line_items: Record<string, unknown>[];

  @Column({ type: 'jsonb', default: [] })
  receipt_documents: Record<string, unknown>[];

  @Column({ type: 'text', nullable: true })
  reimbursement_method: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
