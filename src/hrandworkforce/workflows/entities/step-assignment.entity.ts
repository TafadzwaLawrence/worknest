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
import { AssignmentType } from './workflow.enums.js';

@Entity('step_assignments')
export class StepAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  step_id: string;

  @Column({ type: 'enum', enum: AssignmentType })
  assignment_type: AssignmentType;

  @Column({ type: 'uuid', nullable: true })
  assignee_id: string;

  @Column({ type: 'text', nullable: true })
  assignee_value: string;

  @Column({ type: 'uuid', nullable: true })
  fallback_assignee_id: string;

  @Column({ type: 'int', default: 0 })
  priority: number;

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
