import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('feedback_votes')
@Unique(['tenant_id', 'feedback_id', 'employee_id'])
export class FeedbackVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  feedback_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'text' })
  vote_type: string; // 'upvote', 'downvote'

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
