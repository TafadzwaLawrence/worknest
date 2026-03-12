import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { SentimentScore } from '../engagement.enums.js';

@Entity('pulse_responses')
@Unique(['tenant_id', 'question_id', 'employee_id', 'response_date'])
export class PulseResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  question_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  response_value: number;

  @Column({ type: 'enum', enum: SentimentScore, nullable: true })
  sentiment: SentimentScore;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ type: 'date' })
  response_date: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
