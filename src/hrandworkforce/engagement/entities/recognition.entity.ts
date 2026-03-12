import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { RecognitionType, FeedbackVisibility } from '../engagement.enums.js';

@Entity('recognitions')
export class Recognition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  program_id: string;

  @Column({ type: 'uuid' })
  giver_id: string;

  @Column({ type: 'uuid' })
  receiver_id: string;

  @Column({ type: 'enum', enum: RecognitionType })
  recognition_type: RecognitionType;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'int', default: 0 })
  points_awarded: number;

  @Column({ type: 'enum', enum: FeedbackVisibility, default: FeedbackVisibility.PUBLIC })
  visibility: FeedbackVisibility;

  @Column({ type: 'boolean', default: false })
  is_anonymous: boolean;

  @Column({ type: 'text', default: 'pending' })
  status: string; // 'pending', 'approved', 'rejected', 'awarded'

  @Column({ type: 'uuid', nullable: true })
  approved_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  awarded_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
