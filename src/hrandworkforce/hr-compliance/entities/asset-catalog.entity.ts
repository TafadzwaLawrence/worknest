import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { AssetStatus } from '../hr-compliance.enums.js';
import { AssetType } from '../../onboarding/onboarding.enums.js';

@Entity('asset_catalog')
@Unique(['tenant_id', 'asset_tag'])
export class AssetCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'varchar', length: 100 })
  asset_tag: string;

  @Column({ type: 'text', nullable: true })
  serial_number: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: AssetType })
  category: AssetType;

  @Column({ type: 'text', nullable: true })
  manufacturer: string;

  @Column({ type: 'text', nullable: true })
  model: string;

  @Column({ type: 'date', nullable: true })
  purchase_date: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  purchase_cost: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'enum', enum: AssetStatus, default: AssetStatus.AVAILABLE })
  current_status: AssetStatus;

  @Column({ type: 'uuid', nullable: true })
  current_assignee_id: string;

  @Column({ type: 'uuid', nullable: true })
  work_location_id: string;

  @Column({ type: 'date', nullable: true })
  warranty_expiry_date: string;

  @Column({ type: 'jsonb', default: {} })
  depreciation_schedule: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
