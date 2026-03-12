import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity.js';
import { WorkflowInstance } from './workflow-instance.entity.js';
import { WorkflowStep } from './workflow-step.entity.js';
import { ApprovalAction, InstanceStatus } from './workflow.enums.js';

@Entity('instance_steps')
export class InstanceStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  instance_id: string;

  @Column({ type: 'uuid' })
  step_id: string;

  @Column({ type: 'uuid', nullable: true })
  assigned_to: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  assigned_at: Date | null;

  @Column({ type: 'enum', enum: InstanceStatus, default: InstanceStatus.PENDING })
  status: InstanceStatus;

  @Column({ type: 'timestamptz', nullable: true })
  due_date: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'enum', enum: ApprovalAction, nullable: true })
  action_taken: ApprovalAction | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'int', nullable: true })
  time_taken_seconds: number | null;

  @Column({ type: 'uuid', nullable: true })
  escalated_from: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => WorkflowInstance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instance_id' })
  instance: WorkflowInstance;

  @ManyToOne(() => WorkflowStep, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'step_id' })
  step: WorkflowStep;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
