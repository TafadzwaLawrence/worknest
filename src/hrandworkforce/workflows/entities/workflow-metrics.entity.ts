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
import { Workflow } from './workflow.entity.js';

@Entity('workflow_metrics')
export class WorkflowMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  workflow_id: string;

  @Column({ type: 'date' })
  period_start: Date;

  @Column({ type: 'date' })
  period_end: Date;

  @Column({ type: 'int', default: 0 })
  total_instances: number;

  @Column({ type: 'int', default: 0 })
  completed_instances: number;

  @Column({ type: 'int', default: 0 })
  avg_completion_time_seconds: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  approval_rate: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  rejection_rate: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  escalation_rate: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  avg_steps_per_instance: number;

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
}
