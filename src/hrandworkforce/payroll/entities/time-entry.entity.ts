import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('time_entries')
export class TimeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'date' })
  entry_date: string;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_time: Date;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  regular_hours: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  overtime_hours: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  double_time_hours: number;

  @Column({ type: 'int', default: 0 })
  break_minutes: number;

  @Column({ type: 'text', nullable: true })
  pay_code: string; // 'regular', 'overtime', 'vacation', 'sick'

  @Column({ type: 'text', nullable: true })
  project_code: string;

  @Column({ type: 'text', nullable: true })
  task_description: string;

  @Column({ type: 'boolean', default: false })
  is_approved: boolean;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
