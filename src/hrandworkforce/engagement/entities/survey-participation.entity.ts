import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('survey_participation')
@Unique(['tenant_id', 'survey_id', 'employee_id'])
export class SurveyParticipation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  survey_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  invited_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_reminder_sent: Date;

  @Column({ type: 'int', default: 0 })
  reminder_count: number;

  @Column({ type: 'text', default: 'invited' })
  status: string; // 'invited', 'started', 'completed', 'declined'

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
