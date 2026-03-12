import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity.js';
import { User } from '../../core/entities/user.entity.js';
import { Interview } from './interview.entity.js';

@Entity('interviewers')
export class Interviewer {
  @PrimaryColumn({ type: 'uuid' })
  interview_id: string;

  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text', nullable: true })
  role: string | null;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @Column({ type: 'boolean', default: false })
  attended: boolean;

  @Column({ type: 'jsonb', nullable: true })
  feedback: Record<string, unknown> | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  score: number | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Interview, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'interview_id' })
  interview: Interview;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
