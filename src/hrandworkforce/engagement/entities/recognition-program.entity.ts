import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { RecognitionType } from '../engagement.enums.js';

@Entity('recognition_programs')
@Unique(['tenant_id', 'name'])
export class RecognitionProgram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: RecognitionType })
  recognition_type: RecognitionType;

  @Column({ type: 'int', default: 0 })
  points_value: number;

  @Column({ type: 'boolean', default: false })
  approval_required: boolean;

  @Column({ type: 'uuid', nullable: true })
  workflow_id: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  budget: number;

  @Column({ type: 'date', nullable: true })
  start_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
