import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { GoalType, GoalPeriod, GoalStatus } from '../performance.enums.js';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid', nullable: true })
  parent_goal_id: string;

  @Column({ type: 'uuid', nullable: true })
  template_id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: GoalType, default: GoalType.INDIVIDUAL })
  goal_type: GoalType;

  @Column({ type: 'text', nullable: true })
  category: string;

  @Column({ type: 'enum', enum: GoalPeriod })
  period: GoalPeriod;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  target_value: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  current_value: number;

  @Column({ type: 'text', nullable: true })
  unit: string;

  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.DRAFT })
  status: GoalStatus;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  progress: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 1.0 })
  weight: number;

  @Column({ type: 'boolean', default: false })
  is_private: boolean;

  @Column({ type: 'jsonb', nullable: true })
  key_results: Record<string, unknown>[];

  @Column({ type: 'jsonb', nullable: true })
  milestones: Record<string, unknown>[];

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
