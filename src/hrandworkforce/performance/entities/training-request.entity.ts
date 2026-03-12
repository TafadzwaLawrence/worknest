import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('training_requests')
export class TrainingRequest {
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

  @Column({ type: 'text', nullable: true })
  justification: string;

  @Column({ type: 'text', nullable: true })
  provider: string;

  @Column({ type: 'text', nullable: true })
  course_url: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  estimated_cost: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'date', nullable: true })
  preferred_start_date: string;

  @Column({ type: 'int', nullable: true })
  duration_days: number;

  @Column({ type: 'text', default: 'pending' })
  status: string; // pending, approved, rejected, completed, cancelled

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ type: 'uuid', nullable: true })
  reviewed_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
