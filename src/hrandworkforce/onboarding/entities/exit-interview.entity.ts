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
import { User } from '../../core/entities/user.entity';
import { OffboardingCase } from './offboarding-case.entity';

@Entity('exit_interviews')
export class ExitInterview {
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

  @Column({ type: 'timestamptz', nullable: true })
  scheduled_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  interviewer_user_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'interviewer_user_id' })
  interviewerUser: User | null;

  @Column({ type: 'text', nullable: true })
  interviewer_notes: string | null;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
