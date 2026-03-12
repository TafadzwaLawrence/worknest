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
import { WorkflowStep } from './workflow-step.entity.js';

@Entity('step_metrics')
export class StepMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  step_id: string;

  @Column({ type: 'date' })
  period_start: Date;

  @Column({ type: 'date' })
  period_end: Date;

  @Column({ type: 'int', default: 0 })
  total_assignments: number;

  @Column({ type: 'int', default: 0 })
  avg_completion_time_seconds: number;

  @Column({ type: 'int', default: 0 })
  approval_count: number;

  @Column({ type: 'int', default: 0 })
  rejection_count: number;

  @Column({ type: 'int', default: 0 })
  escalation_count: number;

  @Column({ type: 'int', default: 0 })
  delegation_count: number;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => WorkflowStep, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'step_id' })
  step: WorkflowStep;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
