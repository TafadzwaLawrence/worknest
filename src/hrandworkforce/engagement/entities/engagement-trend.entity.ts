import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('engagement_trends')
export class EngagementTrend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  trend_type: string; // 'overall', 'by_department', 'by_tenure', 'by_role'

  @Column({ type: 'uuid', nullable: true })
  reference_id: string;

  @Column({ type: 'date' })
  period_start: string;

  @Column({ type: 'date' })
  period_end: string;

  @Column({ type: 'jsonb', nullable: true })
  data_points: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  trend_direction: string; // 'improving', 'declining', 'stable'

  @Column({ type: 'text', nullable: true })
  insights: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
