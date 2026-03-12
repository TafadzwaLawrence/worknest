import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legal_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  subdomain: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ type: 'varchar', length: 2 })
  country_code: string;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  business_language: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  indiginous_language: string;

  @Column({ type: 'date', nullable: true })
  fiscal_year_start: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contact_phone: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cell_phone_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'jsonb', nullable: true })
  address: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, unknown>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tax_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vat_registration_number: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bp_number: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
