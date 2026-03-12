import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { BenefitType } from '../payroll.enums.js';

@Entity('benefit_plans')
@Unique(['tenant_id', 'name'])
export class BenefitPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: BenefitType })
  benefit_type: BenefitType;

  @Column({ type: 'text', nullable: true })
  provider_name: string;

  @Column({ type: 'text', nullable: true })
  plan_code: string;

  @Column({ type: 'jsonb', nullable: true })
  eligibility_rules: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  employer_contribution: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  employee_contribution: Record<string, unknown>;

  @Column({ type: 'date' })
  effective_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
