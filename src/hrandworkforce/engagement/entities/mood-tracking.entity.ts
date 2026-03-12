import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('mood_tracking')
@Unique(['tenant_id', 'employee_id', 'track_date'])
export class MoodTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  // CHECK (mood_score >= 1 AND mood_score <= 5) enforced at DB level
  @Column({ type: 'int' })
  mood_score: number;

  @Column({ type: 'text', nullable: true })
  mood_emoji: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  factors: Record<string, unknown>;

  @Column({ type: 'date' })
  track_date: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
