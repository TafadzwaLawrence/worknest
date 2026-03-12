import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { SalaryRevisionType } from '../hr-compliance.enums.js';

// Append-only: no updated_at, no deleted_at
@Entity('salary_revisions')
export class SalaryRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'date' })
  effective_date: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  previous_salary: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  new_salary: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'enum', enum: SalaryRevisionType })
  revision_type: SalaryRevisionType;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  revised_by: string;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
