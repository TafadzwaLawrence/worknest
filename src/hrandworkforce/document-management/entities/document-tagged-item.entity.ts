import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity.js';
import { Document } from './document.entity.js';
import { DocumentTag } from './document-tag.entity.js';

@Entity('document_tagged_items')
export class DocumentTaggedItem {
  @PrimaryColumn({ type: 'uuid' })
  tag_id: string;

  @PrimaryColumn({ type: 'uuid' })
  document_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => DocumentTag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: DocumentTag;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
