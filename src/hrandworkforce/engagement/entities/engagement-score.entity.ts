import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('engagement_scores')
@Unique(['tenant_id', 'employee_id', 'calculation_date'])
export class EngagementScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  overall_score: number;

  @Column({ type: 'jsonb', nullable: true })
  category_scores: Record<string, unknown>;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  benchmark_comparison: number;

  @Column({ type: 'date' })
  calculation_date: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
