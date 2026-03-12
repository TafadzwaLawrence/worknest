import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { SentimentScore } from '../engagement.enums.js';

@Entity('survey_responses')
@Unique(['tenant_id', 'survey_id', 'employee_id', 'question_id'])
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  survey_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid' })
  question_id: string;

  @Column({ type: 'text', nullable: true })
  response_value: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  numeric_value: number;

  @Column({ type: 'jsonb', nullable: true })
  selected_options: Record<string, unknown>;

  @Column({ type: 'enum', enum: SentimentScore, nullable: true })
  sentiment: SentimentScore;

  @Column({ type: 'int', nullable: true })
  response_time_seconds: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  submitted_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
