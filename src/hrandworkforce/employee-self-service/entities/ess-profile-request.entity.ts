import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { EssRequestStatus } from '../ess.enums.js';

@Entity('ess_profile_requests')
export class EssProfileRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'text' })
  request_type: string; // 'personal_info','address','contact','emergency_contact','bank','tax','other'

  @Column({ type: 'jsonb' })
  requested_changes: Record<string, unknown>;

  @Column({ type: 'enum', enum: EssRequestStatus, default: EssRequestStatus.SUBMITTED })
  status: EssRequestStatus;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  submitted_at: Date;

  @Column({ type: 'uuid', nullable: true })
  reviewed_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at: Date;

  @Column({ type: 'text', nullable: true })
  review_comments: string;

  @Column({ type: 'date', nullable: true })
  effective_date: string;

  @Column({ type: 'uuid', nullable: true })
  workflow_instance_id: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
