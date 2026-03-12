import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { EssAckStatus } from '../ess.enums.js';

@Entity('ess_acknowledgments')
@Unique(['tenant_id', 'employee_id', 'document_id'])
export class EssAcknowledgment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid' })
  document_id: string;

  @Column({ type: 'enum', enum: EssAckStatus, default: EssAckStatus.REQUIRED })
  status: EssAckStatus;

  @Column({ type: 'timestamptz', nullable: true })
  acked_at: Date;

  @Column({ type: 'text', nullable: true })
  ack_version: string;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
