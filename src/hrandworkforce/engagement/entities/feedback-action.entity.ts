import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('feedback_actions')
export class FeedbackAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  feedback_id: string;

  @Column({ type: 'uuid', nullable: true })
  assigned_to: string;

  @Column({ type: 'text' })
  action_text: string;

  @Column({ type: 'date', nullable: true })
  due_date: string;

  @Column({ type: 'text', default: 'open' })
  status: string; // 'open', 'in_progress', 'completed', 'cancelled'

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
