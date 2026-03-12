import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';

@Entity('competencies')
@Unique(['framework_id', 'name'])
export class Competency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  framework_id: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  category: string;

  @Column({ type: 'jsonb', nullable: true })
  behavioral_indicators: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  is_core: boolean;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 1.0 })
  weight: number;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
