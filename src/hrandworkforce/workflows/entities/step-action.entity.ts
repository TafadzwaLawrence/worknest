import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity.js';
import { InstanceStep } from './instance-step.entity.js';
import { ApprovalAction } from './workflow.enums.js';

@Entity('step_actions')
export class StepAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  instance_step_id: string;

  @Column({ type: 'uuid' })
  action_by: string;

  @Column({ type: 'enum', enum: ApprovalAction })
  action_taken: ApprovalAction;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => InstanceStep, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instance_step_id' })
  instanceStep: InstanceStep;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
