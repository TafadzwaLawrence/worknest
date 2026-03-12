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
import { NoteVisibility } from '../onboarding.enums';

@Entity('offboarding_notes')
export class OffboardingNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  case_id: string;

  @ManyToOne(() => OffboardingCase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  offboardingCase: OffboardingCase;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  author: User | null;

  @Column({ type: 'enum', enum: NoteVisibility, default: NoteVisibility.Private })
  visibility: NoteVisibility;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
