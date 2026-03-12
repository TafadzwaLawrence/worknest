import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('benefit_enrollments')
@Unique(['tenant_id', 'employee_id', 'benefit_plan_id', 'effective_date'])
export class BenefitEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid' })
  benefit_plan_id: string;

  @Column({ type: 'text', nullable: true })
  coverage_level: string; // 'employee', 'employee+spouse', 'family'

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  election_amount: number;

  @Column({ type: 'date' })
  effective_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'date' })
  enrollment_date: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
