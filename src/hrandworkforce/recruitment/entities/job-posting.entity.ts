import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity.js';
import { User } from '../../core/entities/user.entity.js';
import { JobRequisition } from './job-requisition.entity.js';

@Entity('job_postings')
export class JobPosting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  requisition_id: string | null;

  @Column({ type: 'text', nullable: true })
  external_id: string | null;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  slug: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'text', nullable: true })
  full_description: string | null;

  @Column({ type: 'text', nullable: true })
  location: string | null;

  @Column({ type: 'boolean', default: false })
  is_remote: boolean;

  @Column({ type: 'text', nullable: true })
  employment_type: string | null;

  @Column({ type: 'jsonb', nullable: true })
  compensation_range: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  publish_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expire_at: Date | null;

  @Column({ type: 'text', nullable: true })
  apply_url: string | null;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string | null;

  @Column({ type: 'int', default: 1 })
  version: number;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => JobRequisition, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'requisition_id' })
  requisition: JobRequisition;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
