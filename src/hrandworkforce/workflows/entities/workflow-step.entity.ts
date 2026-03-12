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
import { Workflow } from './workflow.entity.js';
import { ApprovalAction, StepType } from './workflow.enums.js';

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  workflow_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: StepType })
  step_type: StepType;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'boolean', default: true })
  is_required: boolean;

  @Column({ type: 'int', nullable: true })
  timeout_hours: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 100 })
  approval_threshold: number;

  @Column({ type: 'text', array: true, nullable: true })
  actions_allowed: ApprovalAction[];

  @Column({ type: 'jsonb', nullable: true })
  conditions: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Workflow, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
