import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PipStatus } from '../hr-compliance.enums.js';

// CHECK (end_date > start_date) enforced at DB level
@Entity('pip_records')
export class PipRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid', nullable: true })
  disciplinary_case_id: string;

  @Column({ type: 'uuid', nullable: true })
  review_cycle_id: string;

  @Column({ type: 'text', default: 'Performance Improvement Plan' })
  title: string;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ type: 'enum', enum: PipStatus, default: PipStatus.ACTIVE })
  status: PipStatus;

  @Column({ type: 'jsonb', default: [] })
  objectives: Record<string, unknown>[];

  @Column({ type: 'jsonb', default: [] })
  check_in_schedule: Record<string, unknown>[];

  @Column({ type: 'text', nullable: true })
  progress_notes: string;

  @Column({ type: 'text', nullable: true })
  final_outcome: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
