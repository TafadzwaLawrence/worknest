import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { SurveyType, SurveyStatus } from '../engagement.enums.js';

@Entity('engagement_surveys')
@Unique(['tenant_id', 'title'])
export class EngagementSurvey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: SurveyType, default: SurveyType.ENGAGEMENT })
  survey_type: SurveyType;

  @Column({ type: 'text', nullable: true })
  frequency: string; // 'once', 'quarterly', 'monthly', 'weekly'

  @Column({ type: 'enum', enum: SurveyStatus, default: SurveyStatus.DRAFT })
  status: SurveyStatus;

  @Column({ type: 'boolean', default: true })
  is_anonymous: boolean;

  @Column({ type: 'boolean', default: true })
  is_confidential: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  start_date: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_date: Date;

  @Column({ type: 'jsonb', nullable: true })
  reminder_settings: Record<string, unknown>;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 80 })
  participation_goal: number;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
