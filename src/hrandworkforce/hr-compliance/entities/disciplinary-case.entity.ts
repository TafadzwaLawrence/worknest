import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { DisciplinarySeverity, DisciplinaryStatus } from '../hr-compliance.enums.js';

@Entity('disciplinary_cases')
@Unique(['tenant_id', 'case_number'])
export class DisciplinaryCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'varchar', length: 50 })
  case_number: string;

  @Column({ type: 'date' })
  incident_date: string;

  @Column({ type: 'text', nullable: true })
  category: string; // 'conduct', 'performance', 'attendance', 'policy_violation'

  @Column({ type: 'enum', enum: DisciplinarySeverity })
  severity: DisciplinarySeverity;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  raised_by: string;

  @Column({ type: 'enum', enum: DisciplinaryStatus, default: DisciplinaryStatus.OPEN })
  status: DisciplinaryStatus;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at: Date;

  @Column({ type: 'text', nullable: true })
  resolution_notes: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
