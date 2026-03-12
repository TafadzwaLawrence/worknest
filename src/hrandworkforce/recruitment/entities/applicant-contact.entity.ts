import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity.js';
import { User } from '../../core/entities/user.entity.js';
import { Applicant } from './applicant.entity.js';
import { ApplicantContactType } from './recruitment.enums.js';

@Entity('applicant_contacts')
export class ApplicantContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  applicant_id: string;

  @Column({ type: 'enum', enum: ApplicantContactType })
  type: ApplicantContactType;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'boolean', default: false })
  is_preferred: boolean;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Applicant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_id' })
  applicant: Applicant;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
