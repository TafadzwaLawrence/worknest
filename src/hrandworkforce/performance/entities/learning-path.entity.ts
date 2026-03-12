import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';

@Entity('learning_paths')
@Unique(['tenant_id', 'name'])
export class LearningPath {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  category: string;

  @Column({ type: 'jsonb', default: '[]' })
  courses: string[]; // Array of course UUIDs

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  estimated_hours: number;

  @Column({ type: 'uuid', nullable: true })
  target_designation_id: string;

  @Column({ type: 'text', nullable: true })
  target_role: string;

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
