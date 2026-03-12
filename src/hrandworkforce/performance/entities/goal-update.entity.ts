import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('goal_updates')
export class GoalUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  goal_id: string;

  @Column({ type: 'uuid' })
  updated_by: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  previous_value: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  new_value: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  progress_change: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  update_date: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  evidence_url: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
