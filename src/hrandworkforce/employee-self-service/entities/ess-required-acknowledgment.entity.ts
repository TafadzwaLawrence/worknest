import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('ess_required_acknowledgments')
@Unique(['tenant_id', 'document_id', 'effective_from'])
export class EssRequiredAcknowledgment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  document_id: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  effective_from: string;

  @Column({ type: 'date', nullable: true })
  effective_to: string;

  @Column({
    type: 'jsonb',
    default: { allEmployees: true, departments: [], locations: [] },
  })
  target: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
