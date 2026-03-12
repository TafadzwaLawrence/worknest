import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { CourseStatus } from '../performance.enums.js';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  level: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  duration_hours: number;

  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.DRAFT })
  status: CourseStatus;

  @Column({ type: 'uuid', nullable: true })
  instructor_id: string;

  @Column({ type: 'text', nullable: true })
  thumbnail_url: string;

  @Column({ type: 'jsonb', nullable: true })
  prerequisites: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  is_mandatory: boolean;

  @Column({ type: 'date', nullable: true })
  validity_period_days: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 70 })
  passing_score: number;

  @Column({ type: 'tsvector', select: false, nullable: true, insert: false, update: false } as any)
  search_vector: unknown;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
