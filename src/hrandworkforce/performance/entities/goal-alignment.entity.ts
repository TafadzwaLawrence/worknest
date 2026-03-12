import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('goal_alignments')
@Unique(['goal_id', 'aligned_goal_id'])
export class GoalAlignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  goal_id: string;

  @Column({ type: 'uuid' })
  aligned_goal_id: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 1.0 })
  alignment_strength: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
