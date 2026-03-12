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
import { InstanceStatus } from './workflow.enums.js';

@Entity('workflow_instances')
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  workflow_id: string;

  @Column({ type: 'uuid' })
  entity_id: string;

  @Column({ type: 'text' })
  entity_type: string;

  @Column({ type: 'uuid' })
  initiator_id: string;

  @Column({ type: 'uuid', nullable: true })
  current_step_id: string | null;

  @Column({ type: 'enum', enum: InstanceStatus, default: InstanceStatus.PENDING })
  status: InstanceStatus;

  @Column({ type: 'text', default: 'normal' })
  priority: string;

  @Column({ type: 'timestamptz', nullable: true })
  due_date: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

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
