import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

// Append-only: no updated_at
@Entity('disciplinary_documents')
@Unique(['case_id', 'document_id'])
export class DisciplinaryDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  case_id: string;

  @Column({ type: 'uuid' })
  document_id: string;

  @Column({ type: 'uuid', nullable: true })
  uploaded_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
