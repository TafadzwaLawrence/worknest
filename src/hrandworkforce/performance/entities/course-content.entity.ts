import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContentType } from '../performance.enums.js';

@Entity('course_content')
export class CourseContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  module_id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'enum', enum: ContentType })
  type: ContentType;

  @Column({ type: 'jsonb' })
  content: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  order_index: number;

  @Column({ type: 'int', nullable: true })
  duration_minutes: number;

  @Column({ type: 'boolean', default: false })
  is_mandatory: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
