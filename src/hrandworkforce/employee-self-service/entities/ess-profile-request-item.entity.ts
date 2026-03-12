import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('ess_profile_request_items')
export class EssProfileRequestItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  request_id: string;

  @Column({ type: 'text' })
  field_path: string; // e.g. 'address.street' or 'contacts[0].value'

  @Column({ type: 'jsonb', nullable: true })
  old_value: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  new_value: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
