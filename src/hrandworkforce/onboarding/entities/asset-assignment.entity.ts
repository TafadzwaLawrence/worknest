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
import { Employee } from '../../core/entities/employee.entity';
import { CaseType, AssetType } from '../onboarding.enums';

@Entity('asset_assignments')
export class AssetAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  employee_id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'enum', enum: CaseType, nullable: true })
  case_type: CaseType | null;

  @Column({ type: 'uuid', nullable: true })
  case_id: string | null;

  @Column({ type: 'enum', enum: AssetType })
  asset_type: AssetType;

  @Column({ type: 'text', nullable: true })
  asset_tag: string | null;

  @Column({ type: 'text', nullable: true })
  serial_number: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  assigned_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  due_return_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  returned_at: Date | null;

  @Column({ type: 'text', nullable: true })
  condition_on_return: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
