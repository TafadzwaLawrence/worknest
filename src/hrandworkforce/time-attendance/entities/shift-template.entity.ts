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

@Entity('shift_templates')
@Unique(['tenant_id', 'code'])
export class ShiftTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  // GENERATED ALWAYS AS ... STORED — read-only
  @Column({ type: 'interval', insert: false, update: false, nullable: true })
  duration: string | null;

  @Column({ type: 'interval', default: '1 hour' })
  break_duration: string;

  @Column({ type: 'jsonb', default: {} })
  break_rules: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  is_night_shift: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

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
