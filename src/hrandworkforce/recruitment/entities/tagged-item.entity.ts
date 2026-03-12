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
import { Tag } from './tag.entity.js';

@Entity('tagged_items')
export class TaggedItem {
  @PrimaryColumn({ type: 'uuid' })
  tag_id: string;

  @PrimaryColumn({ type: 'text' })
  item_type: string;

  @PrimaryColumn({ type: 'uuid' })
  item_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
