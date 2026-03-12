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
import { InstanceStep } from './instance-step.entity.js';

@Entity('step_delegations')
export class StepDelegation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  instance_step_id: string;

  @Column({ type: 'uuid' })
  original_assignee: string;

  @Column({ type: 'uuid' })
  delegated_to: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'timestamptz' })
  start_date: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_date: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => InstanceStep, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instance_step_id' })
  instanceStep: InstanceStep;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
