import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { EssOwnerType } from '../ess.enums.js';

@Entity('ess_attachments')
export class EssAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'enum', enum: EssOwnerType })
  owner_type: EssOwnerType;

  @Column({ type: 'uuid' })
  owner_id: string;

  @Column({ type: 'uuid' })
  document_id: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
