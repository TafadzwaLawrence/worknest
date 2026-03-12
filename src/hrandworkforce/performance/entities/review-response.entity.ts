import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('review_responses')
@Unique(['review_id', 'participant_id', 'question_id'])
export class ReviewResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  review_id: string;

  @Column({ type: 'uuid' })
  participant_id: string;

  @Column({ type: 'text' })
  question_id: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ type: 'jsonb', nullable: true })
  evidence: Record<string, unknown>;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  submitted_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
