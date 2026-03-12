import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { CompetencyLevel } from '../performance.enums.js';

@Entity('employee_competencies')
@Unique(['employee_id', 'competency_id'])
export class EmployeeCompetency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid' })
  competency_id: string;

  @Column({ type: 'enum', enum: CompetencyLevel, nullable: true })
  current_level: CompetencyLevel;

  @Column({ type: 'enum', enum: CompetencyLevel, nullable: true })
  target_level: CompetencyLevel;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  confidence_level: number;

  @Column({ type: 'date', nullable: true })
  assessed_date: string;

  @Column({ type: 'date', nullable: true })
  next_review_date: string;

  @Column({ type: 'uuid', nullable: true })
  assessed_by: string;

  @Column({ type: 'jsonb', nullable: true })
  evidence: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
