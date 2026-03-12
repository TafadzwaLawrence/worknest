import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { SentimentScore, FeedbackVisibility } from '../engagement.enums.js';

@Entity('employee_feedback')
export class EmployeeFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  channel_id: string;

  @Column({ type: 'uuid', nullable: true })
  author_id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: SentimentScore, nullable: true })
  sentiment: SentimentScore;

  @Column({ type: 'enum', enum: FeedbackVisibility, default: FeedbackVisibility.PUBLIC })
  visibility: FeedbackVisibility;

  @Column({ type: 'int', default: 0 })
  upvotes: number;

  @Column({ type: 'int', default: 0 })
  downvotes: number;

  @Column({ type: 'text', default: 'submitted' })
  status: string; // 'submitted', 'under_review', 'acknowledged', 'implemented', 'rejected'

  @Column({ type: 'text', default: 'medium' })
  priority: string; // 'low', 'medium', 'high', 'critical'

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
