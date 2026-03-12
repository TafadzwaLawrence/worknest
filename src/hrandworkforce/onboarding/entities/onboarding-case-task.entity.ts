import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity';
import { User } from '../../core/entities/user.entity';
import { Employee } from '../../core/entities/employee.entity';
import { OnboardingCase } from './onboarding-case.entity';
import { OnboardingTemplateTask } from './onboarding-template-task.entity';
import { TaskStatus, PriorityLevel } from '../onboarding.enums';

@Entity('onboarding_case_tasks')
export class OnboardingCaseTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  case_id: string;

  @ManyToOne(() => OnboardingCase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  onboardingCase: OnboardingCase;

  @Column({ type: 'uuid', nullable: true })
  template_task_id: string | null;

  @ManyToOne(() => OnboardingTemplateTask, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'template_task_id' })
  templateTask: OnboardingTemplateTask | null;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.Pending })
  status: TaskStatus;

  @Column({ type: 'enum', enum: PriorityLevel, default: PriorityLevel.Normal })
  priority: PriorityLevel;

  @Column({ type: 'uuid', nullable: true })
  assignee_user_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_user_id' })
  assigneeUser: User | null;

  @Column({ type: 'uuid', nullable: true })
  assignee_employee_id: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_employee_id' })
  assigneeEmployee: Employee | null;

  @Column({ type: 'date', nullable: true })
  due_date: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  blocked_reason: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
