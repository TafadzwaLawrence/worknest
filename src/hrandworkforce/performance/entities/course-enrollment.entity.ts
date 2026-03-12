import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { EnrollmentStatus } from '../performance.enums.js';

@Entity('course_enrollments')
@Unique(['employee_id', 'course_id'])
export class CourseEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid' })
  course_id: string;

  @Column({ type: 'enum', enum: EnrollmentStatus, default: EnrollmentStatus.ENROLLED })
  status: EnrollmentStatus;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  completion_percentage: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ type: 'timestamptz', nullable: true })
  enrolled_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date: string;

  @Column({ type: 'uuid', nullable: true })
  enrolled_by: string;

  @Column({ type: 'text', nullable: true })
  certificate_url: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
