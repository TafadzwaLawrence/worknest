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
import { WorkflowStep } from './workflow-step.entity.js';
import { AssignmentType, EscalationStrategy } from './workflow.enums.js';

@Entity('escalation_rules')
export class EscalationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  step_id: string;

  @Column({ type: 'enum', enum: EscalationStrategy })
  strategy: EscalationStrategy;

  @Column({ type: 'int' })
  after_hours: number;

  @Column({ type: 'enum', enum: AssignmentType })
  target_type: AssignmentType;

  @Column({ type: 'uuid', nullable: true })
  target_id: string;

  @Column({ type: 'text', nullable: true })
  target_value: string;

  @Column({ type: 'int', default: 3 })
  max_escalations: number;

  @Column({ type: 'boolean', default: true })
  notify_original_assignee: boolean;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

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

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
