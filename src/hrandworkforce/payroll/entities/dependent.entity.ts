import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('dependents')
export class Dependent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'text' })
  first_name: string;

  @Column({ type: 'text' })
  last_name: string;

  @Column({ type: 'text' })
  relationship: string; // 'spouse', 'child', 'domestic_partner'

  @Column({ type: 'date', nullable: true })
  date_of_birth: string;

  // SECURITY: PII — must be encrypted at application layer before storage
  @Column({ type: 'text', nullable: true })
  ssn: string;

  @Column({ type: 'boolean', default: false })
  is_beneficiary: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
