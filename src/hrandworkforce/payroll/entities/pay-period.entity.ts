import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { PayFrequency } from '../payroll.enums.js';

@Entity('pay_periods')
@Unique(['tenant_id', 'start_date', 'end_date'])
export class PayPeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  period_name: string;

  @Column({ type: 'enum', enum: PayFrequency })
  pay_frequency: PayFrequency;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ type: 'date' })
  pay_date: string;

  @Column({ type: 'boolean', default: false })
  is_processed: boolean;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
