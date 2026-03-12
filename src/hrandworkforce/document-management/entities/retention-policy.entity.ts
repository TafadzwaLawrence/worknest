import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity.js';
import { DocumentCategory } from './document-category.entity.js';
import { DocumentTag } from './document-tag.entity.js';
import { RetentionAction } from './document-management.enums.js';

@Entity('retention_policies')
export class RetentionPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  applies_to: string;

  @Column({ type: 'uuid', nullable: true })
  category_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  tag_id: string | null;

  @Column({ type: 'int' })
  retain_for_months: number;

  @Column({ type: 'enum', enum: RetentionAction, default: RetentionAction.RETAIN })
  action: RetentionAction;

  @Column({ type: 'boolean', default: false })
  legal_hold: boolean;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => DocumentCategory, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: DocumentCategory;

  @ManyToOne(() => DocumentTag, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tag_id' })
  tag: DocumentTag;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
