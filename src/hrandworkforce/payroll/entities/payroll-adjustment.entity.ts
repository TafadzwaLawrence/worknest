import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('payroll_adjustments')
export class PayrollAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  original_payroll_record_id: string;

  @Column({ type: 'text' })
  adjustment_type: string; // 'correction', 'adjustment', 'void'

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  effective_date: string;

  @Column({ type: 'uuid', nullable: true })
  processed_by: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  processed_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;
}
