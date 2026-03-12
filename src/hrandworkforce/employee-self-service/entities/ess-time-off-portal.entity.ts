import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('ess_time_off_portal')
@Unique(['tenant_id', 'leave_request_id'])
export class EssTimeOffPortal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid' })
  leave_request_id: string;

  @Column({ type: 'text', default: 'web' })
  submitted_from: string; // 'web', 'mobile'

  @Column({ type: 'jsonb', nullable: true })
  attachments: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
