import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity.js';
import { WorkflowInstance } from './workflow-instance.entity.js';
import { InstanceStep } from './instance-step.entity.js';

@Entity('workflow_notifications')
export class WorkflowNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  instance_id: string;

  @Column({ type: 'uuid', nullable: true })
  instance_step_id: string;

  @Column({ type: 'uuid' })
  recipient_id: string;

  @Column({ type: 'text' })
  notification_type: string;

  @Column({ type: 'text' })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', default: 'normal' })
  priority: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  read_at: Date;

  @Column({ type: 'boolean', default: false })
  action_required: boolean;

  @Column({ type: 'text', nullable: true })
  action_url: string;

  @Column({ type: 'text', array: true, nullable: true })
  sent_via: string[];

  @Column({ type: 'timestamptz', default: () => 'now()' })
  sent_at: Date;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => WorkflowInstance, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instance_id' })
  instance: WorkflowInstance;

  @ManyToOne(() => InstanceStep, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instance_step_id' })
  instanceStep: InstanceStep;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
