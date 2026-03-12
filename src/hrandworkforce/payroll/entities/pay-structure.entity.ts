import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('pay_structures')
export class PayStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'text' })
  pay_type: string; // 'salary', 'hourly', 'commission', 'bonus'

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  pay_rate: number;

  @Column({ type: 'text', default: 'USD' })
  currency: string;

  @Column({ type: 'date' })
  effective_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
