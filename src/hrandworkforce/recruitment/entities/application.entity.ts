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
import { Applicant } from './applicant.entity.js';
import { JobPosting } from './job-posting.entity.js';
import { JobRequisition } from './job-requisition.entity.js';
import { Pipeline } from './pipeline.entity.js';
import { PipelineStage } from './pipeline-stage.entity.js';
import { ApplicationStatus } from './recruitment.enums.js';

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  applicant_id: string;

  @Column({ type: 'uuid', nullable: true })
  job_posting_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  requisition_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  pipeline_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  stage_id: string | null;

  @Column({ type: 'text', nullable: true })
  source: string | null;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.APPLIED })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  apply_reference: string | null;

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

  @ManyToOne(() => Applicant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_id' })
  applicant: Applicant;

  @ManyToOne(() => JobPosting, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'job_posting_id' })
  jobPosting: JobPosting;

  @ManyToOne(() => JobRequisition, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'requisition_id' })
  requisition: JobRequisition;

  @ManyToOne(() => Pipeline, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: Pipeline;

  @ManyToOne(() => PipelineStage, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'stage_id' })
  stage: PipelineStage;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ type: 'timestamptz' })
  applied_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
