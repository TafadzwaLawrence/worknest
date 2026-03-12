import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// DB-level unique index via COALESCE on department_id, team_id, metric_date — not expressible with @Unique decorator
@Entity('team_engagement_metrics')
export class TeamEngagementMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  department_id: string;

  @Column({ type: 'uuid', nullable: true })
  team_id: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  engagement_score: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  participation_rate: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  eNPS: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  turnover_rate: number;

  @Column({ type: 'int', nullable: true })
  total_employees: number;

  @Column({ type: 'int', nullable: true })
  actively_engaged: number;

  @Column({ type: 'int', nullable: true })
  disengaged: number;

  @Column({ type: 'date' })
  metric_date: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
