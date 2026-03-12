import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity.js';
import { User } from '../../core/entities/user.entity.js';
import { Document } from './document.entity.js';
import { DocOwnerType } from './document-management.enums.js';

@Entity('document_links')
export class DocumentLink {
  @PrimaryColumn({ type: 'uuid' })
  document_id: string;

  @PrimaryColumn({ type: 'enum', enum: DocOwnerType })
  owner_type: DocOwnerType;

  @PrimaryColumn({ type: 'uuid' })
  owner_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  linked_by: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'linked_by' })
  linker: User;

  @CreateDateColumn({ type: 'timestamptz' })
  linked_at: Date;
}
