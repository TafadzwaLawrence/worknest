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
import { ConditionOperator } from './workflow.enums.js';

@Entity('workflow_conditions')
export class WorkflowCondition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  condition_type: string;

  @Column({ type: 'text' })
  entity_type: string;

  @Column({ type: 'text' })
  field_path: string;

  @Column({ type: 'enum', enum: ConditionOperator })
  operator: ConditionOperator;

  @Column({ type: 'text', nullable: true })
  comparison_value: string;

  @Column({ type: 'text', array: true, nullable: true })
  comparison_values: string[];

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
