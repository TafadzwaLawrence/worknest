import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { SentimentScore } from '../engagement.enums.js';

@Entity('feedback_comments')
export class FeedbackComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  feedback_id: string;

  @Column({ type: 'uuid', nullable: true })
  author_id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: SentimentScore, nullable: true })
  sentiment: SentimentScore;

  @Column({ type: 'boolean', default: false })
  is_anonymous: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
