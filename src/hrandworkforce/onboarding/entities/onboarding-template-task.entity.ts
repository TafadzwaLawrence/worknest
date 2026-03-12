import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity';
import { OnboardingTemplate } from './onboarding-template.entity';
import { PriorityLevel } from '../onboarding.enums';

@Entity('onboarding_template_tasks')
export class OnboardingTemplateTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  template_id: string;

  @ManyToOne(() => OnboardingTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: OnboardingTemplate;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 0 })
  relative_day_offset: number;

  @Column({ type: 'enum', enum: PriorityLevel, default: PriorityLevel.Normal })
  priority: PriorityLevel;

  @Column({ type: 'boolean', default: true })
  required: boolean;

  @Column({ type: 'text', nullable: true })
  assigned_to_type: string | null;

  @Column({ type: 'uuid', nullable: true })
  assigned_to_id: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
