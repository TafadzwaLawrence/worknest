import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { ReviewType, RatingScale } from '../performance.enums.js';

@Entity('review_templates')
@Unique(['tenant_id', 'name'])
export class ReviewTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ReviewType })
  review_type: ReviewType;

  @Column({ type: 'enum', enum: RatingScale, default: RatingScale.SCALE_1_5 })
  rating_scale: RatingScale;

  @Column({ type: 'jsonb' })
  questions: Record<string, unknown>[];

  @Column({ type: 'jsonb', nullable: true })
  weightings: Record<string, unknown>;

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
