import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ess_time_off_drafts')
export class EssTimeOffDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'jsonb' })
  draft_data: Record<string, unknown>; // {leave_type_id, start_date, end_date, half_day, reason, attachments}

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
