import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('review_participants')
@Unique(['review_id', 'participant_id'])
export class ReviewParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  review_id: string;

  @Column({ type: 'uuid' })
  participant_id: string;

  @Column({ type: 'text' })
  relationship_type: string; // 'manager', 'peer', 'direct_report', 'self', 'other'

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 1.0 })
  weight: number;

  @Column({ type: 'boolean', default: true })
  is_required: boolean;

  @Column({ type: 'boolean', default: false })
  is_completed: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  invited_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  reminder_sent_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
