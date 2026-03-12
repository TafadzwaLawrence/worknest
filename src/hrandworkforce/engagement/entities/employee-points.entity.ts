import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('employee_points')
@Unique(['tenant_id', 'employee_id'])
export class EmployeePoints {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'int', default: 0 })
  total_points_earned: number;

  @Column({ type: 'int', default: 0 })
  points_available: number;

  @Column({ type: 'int', default: 0 })
  points_redeemed: number;

  @Column({ type: 'date', nullable: true })
  last_earned_date: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
