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
import { OffboardingCase } from './offboarding-case.entity';

@Entity('knowledge_transfer_records')
export class KnowledgeTransferRecord {
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

  @Column({ type: 'uuid' })
  from_employee_id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_employee_id' })
  fromEmployee: Employee;

  @Column({ type: 'uuid', nullable: true })
  to_employee_id: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'to_employee_id' })
  toEmployee: Employee | null;

  @Column({ type: 'text' })
  subject: string;

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
