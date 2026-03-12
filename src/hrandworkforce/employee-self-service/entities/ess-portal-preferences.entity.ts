import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('ess_portal_preferences')
@Unique(['tenant_id', 'employee_id'])
export class EssPortalPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'text', default: 'en' })
  locale: string;

  @Column({ type: 'text', default: 'UTC' })
  timezone: string;

  @Column({
    type: 'jsonb',
    default: { email: true, push: true, sms: false },
  })
  notifications: Record<string, unknown>;

  @Column({
    type: 'jsonb',
    default: { mode: 'system' },
  })
  theme: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
