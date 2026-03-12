import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity.js';
import { User } from '../../core/entities/user.entity.js';
import { StorageLocation } from './storage-location.entity.js';
import { DocStatus } from './document-management.enums.js';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  storage_id: string | null;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  filename: string;

  @Column({ type: 'text', nullable: true })
  file_ext: string | null;

  @Column({ type: 'text', nullable: true })
  content_type: string | null;

  @Column({ type: 'bigint', nullable: true })
  content_size: number | null;

  @Column({ type: 'text' })
  storage_key: string;

  @Column({ type: 'text', nullable: true })
  checksum: string | null;

  @Column({ type: 'enum', enum: DocStatus, default: DocStatus.ACTIVE })
  status: DocStatus;

  @Column({ type: 'text', nullable: true })
  extracted_text: string | null;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => StorageLocation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'storage_id' })
  storageLocation: StorageLocation;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
