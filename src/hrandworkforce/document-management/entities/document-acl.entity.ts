import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity.js';
import { Document } from './document.entity.js';

@Entity('document_acl')
export class DocumentAcl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  document_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  principal_type: string;

  @Column({ type: 'uuid', nullable: true })
  principal_id: string | null;

  @Column({ type: 'boolean', default: true })
  can_read: boolean;

  @Column({ type: 'boolean', default: false })
  can_write: boolean;

  @Column({ type: 'boolean', default: false })
  can_delete: boolean;

  @Column({ type: 'boolean', default: false })
  can_share: boolean;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
