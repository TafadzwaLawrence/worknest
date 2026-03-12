import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { QuestionType } from '../engagement.enums.js';

@Entity('survey_questions')
export class SurveyQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  survey_id: string;

  @Column({ type: 'text' })
  question_text: string;

  @Column({ type: 'enum', enum: QuestionType })
  question_type: QuestionType;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'boolean', default: false })
  is_required: boolean;

  @Column({ type: 'jsonb', nullable: true })
  options: Record<string, unknown>;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 1.0 })
  weight: number;

  @Column({ type: 'text', nullable: true })
  category: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  benchmark_value: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
