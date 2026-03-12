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
import { User } from '../../core/entities/user.entity.js';
import { Application } from './application.entity.js';
import { OfferStatus } from './recruitment.enums.js';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  application_id: string;

  @Column({ type: 'uuid', nullable: true })
  offered_by: string | null;

  @Column({ type: 'uuid', nullable: true })
  hiring_manager_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  compensation: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  benefits: Record<string, unknown> | null;

  @Column({ type: 'enum', enum: OfferStatus, default: OfferStatus.PENDING })
  status: OfferStatus;

  @Column({ type: 'timestamptz', nullable: true })
  issued_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  accepted_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  declined_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  withdrawn_at: Date | null;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'offered_by' })
  offerer: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'hiring_manager_id' })
  hiringManager: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
