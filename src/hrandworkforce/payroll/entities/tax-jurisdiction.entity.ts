import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('tax_jurisdictions')
@Unique(['tenant_id', 'jurisdiction_code', 'effective_date'])
export class TaxJurisdiction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  jurisdiction_type: string; // 'federal', 'state', 'local'

  @Column({ type: 'text' })
  jurisdiction_code: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'date' })
  effective_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @Column({ type: 'jsonb' })
  tax_rates: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
