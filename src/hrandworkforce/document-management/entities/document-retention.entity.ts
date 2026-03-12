import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity.js';
import { Document } from './document.entity.js';
import { RetentionPolicy } from './retention-policy.entity.js';
import { RetentionAction } from './document-management.enums.js';

@Entity('document_retention')
export class DocumentRetention {
  @PrimaryColumn({ type: 'uuid' })
  document_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  policy_id: string | null;

  @Column({ type: 'date', nullable: true })
  next_review_at: string | null;

  @Column({ type: 'enum', enum: RetentionAction, nullable: true })
  next_action: RetentionAction | null;

  @Column({ type: 'boolean', default: false })
  legal_hold: boolean;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @ManyToOne(() => RetentionPolicy, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'policy_id' })
  policy: RetentionPolicy;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
