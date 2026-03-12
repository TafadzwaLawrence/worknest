import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ReviewType, ReviewStatus } from '../performance.enums.js';

@Entity('performance_reviews')
export class PerformanceReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid', nullable: true })
  reviewer_id: string;

  @Column({ type: 'uuid', nullable: true })
  review_cycle_id: string;

  @Column({ type: 'uuid', nullable: true })
  template_id: string;

  @Column({ type: 'enum', enum: ReviewType })
  review_type: ReviewType;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.DRAFT })
  status: ReviewStatus;

  @Column({ type: 'date', nullable: true })
  start_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @Column({ type: 'date', nullable: true })
  due_date: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  overall_rating: number;

  @Column({ type: 'text', nullable: true })
  overall_comments: string;

  @Column({ type: 'text', nullable: true })
  strengths: string;

  @Column({ type: 'text', nullable: true })
  development_areas: string;

  @Column({ type: 'jsonb', nullable: true })
  recommendations: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  is_self_review: boolean;

  @Column({ type: 'boolean', default: false })
  is_anonymous: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
