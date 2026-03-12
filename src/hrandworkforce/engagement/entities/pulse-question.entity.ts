import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { QuestionType } from '../engagement.enums.js';

@Entity('pulse_questions')
export class PulseQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  question_text: string;

  @Column({ type: 'enum', enum: QuestionType })
  question_type: QuestionType;

  @Column({ type: 'int', default: 1 })
  scale_min: number;

  @Column({ type: 'int', default: 10 })
  scale_max: number;

  @Column({ type: 'text', default: 'weekly' })
  frequency: string; // 'daily', 'weekly', 'monthly'

  @Column({ type: 'text', nullable: true })
  category: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
