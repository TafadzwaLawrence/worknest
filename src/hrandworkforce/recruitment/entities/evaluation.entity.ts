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
import { User } from '../../core/entities/user.entity.js';
import { Application } from './application.entity.js';
import { Applicant } from './applicant.entity.js';
import { Interview } from './interview.entity.js';

@Entity('evaluations')
export class Evaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  application_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  applicant_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  interview_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  evaluator_id: string | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  score: number | null;

  @Column({ type: 'jsonb', nullable: true })
  criteria: unknown[] | null;

  @Column({ type: 'boolean', nullable: true })
  passed: boolean | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Application, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @ManyToOne(() => Applicant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'applicant_id' })
  applicant: Applicant;

  @ManyToOne(() => Interview, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'interview_id' })
  interview: Interview;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'evaluator_id' })
  evaluator: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
