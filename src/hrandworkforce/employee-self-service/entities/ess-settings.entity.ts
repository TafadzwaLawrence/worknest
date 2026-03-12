import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('ess_settings')
@Unique(['tenant_id'])
export class EssSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({
    type: 'jsonb',
    default: {
      allowProfileEdits: true,
      requireApprovalForPII: true,
      enableTimeOff: true,
      enableDocuments: true,
      showPaySummaries: true,
    },
  })
  features: Record<string, unknown>;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: { logoUrl: null, primaryColor: '#0f62fe', secondaryColor: '#393939' },
  })
  portal_branding: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
