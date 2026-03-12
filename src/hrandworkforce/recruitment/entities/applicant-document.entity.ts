import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity.js';
import { User } from '../../core/entities/user.entity.js';
import { Applicant } from './applicant.entity.js';
import { DocumentType } from './recruitment.enums.js';

@Entity('applicant_documents')
export class ApplicantDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  applicant_id: string;

  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.RESUME })
  document_type: DocumentType;

  @Column({ type: 'text', nullable: true })
  filename: string | null;

  @Column({ type: 'text', nullable: true })
  content_type: string | null;

  @Column({ type: 'bigint', nullable: true })
  content_size: number | null;

  @Column({ type: 'text' })
  storage_key: string;

  @Column({ type: 'text', nullable: true })
  file_hash: string | null;

  @Column({ type: 'text', nullable: true })
  extracted_text: string | null;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  uploaded_by: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Applicant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_id' })
  applicant: Applicant;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @CreateDateColumn({ type: 'timestamptz' })
  uploaded_at: Date;
}
