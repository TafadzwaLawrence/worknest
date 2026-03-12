import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('employee_skills')
@Unique(['employee_id', 'skill_id'])
export class EmployeeSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid' })
  skill_id: string;

  @Column({ type: 'int' })
  proficiency_level: number; // CHECK (1-5)

  @Column({ type: 'int', nullable: true })
  interest_level: number; // CHECK (1-5)

  @Column({ type: 'numeric', precision: 4, scale: 1, default: 0 })
  years_experience: number;

  @Column({ type: 'boolean', default: false })
  is_certified: boolean;

  @Column({ type: 'date', nullable: true })
  certification_date: string;

  @Column({ type: 'date', nullable: true })
  expiry_date: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
