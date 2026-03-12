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
import { Employee } from '../../core/entities/employee.entity';
import { CaseType, ProvisionStatus } from '../onboarding.enums';

@Entity('provisioning_requests')
export class ProvisioningRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'enum', enum: CaseType })
  case_type: CaseType;

  @Column({ type: 'uuid' })
  case_id: string;

  @Column({ type: 'text' })
  request_type: string;

  @Column({ type: 'text', nullable: true })
  target_system: string | null;

  @Column({ type: 'uuid', nullable: true })
  requested_for_employee_id: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requested_for_employee_id' })
  requestedForEmployee: Employee | null;

  @Column({ type: 'uuid', nullable: true })
  requested_by_user_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedByUser: User | null;

  @Column({ type: 'enum', enum: ProvisionStatus, default: ProvisionStatus.Requested })
  status: ProvisionStatus;

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approver: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  provisioned_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
