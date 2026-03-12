import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('development_plan_items')
export class DevelopmentPlanItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  plan_id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  type: string; // training, mentoring, project, shadowing, reading, certification, other

  @Column({ type: 'uuid', nullable: true })
  course_id: string;

  @Column({ type: 'text', nullable: true })
  resource_url: string;

  @Column({ type: 'date', nullable: true })
  target_date: string;

  @Column({ type: 'date', nullable: true })
  completed_date: string;

  @Column({ type: 'text', default: 'pending' })
  status: string; // pending, in_progress, completed, skipped

  @Column({ type: 'int', default: 0 })
  order_index: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
