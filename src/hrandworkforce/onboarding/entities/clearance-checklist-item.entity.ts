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
import { Department } from '../../core/entities/department.entity';
import { OffboardingCase } from './offboarding-case.entity';
import { TaskStatus } from '../onboarding.enums';

@Entity('clearance_checklist_items')
export class ClearanceChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  offboarding_case_id: string;

  @ManyToOne(() => OffboardingCase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offboarding_case_id' })
  offboardingCase: OffboardingCase;

  @Column({ type: 'uuid', nullable: true })
  department_id: string | null;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department: Department | null;

  @Column({ type: 'text' })
  item_name: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.Pending })
  status: TaskStatus;

  @Column({ type: 'date', nullable: true })
  due_date: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
