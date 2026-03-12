import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity';

@Entity('holidays')
@Unique(['tenant_id', 'date', 'name'])
export class Holiday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'date' })
  date: string;

  // GENERATED ALWAYS AS EXTRACT(YEAR FROM date) STORED — read-only
  @Column({ type: 'int', insert: false, update: false, nullable: true })
  year: number | null;

  @Column({ type: 'boolean', default: true })
  is_recurring: boolean;

  @Column({ type: 'boolean', default: false })
  is_half_day: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  half_day_period: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', default: {} })
  applicable_to: Record<string, unknown>;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
