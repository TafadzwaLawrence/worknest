import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { AccessType } from '../ess.enums.js';

@Entity('ess_document_access')
export class EssDocumentAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid' })
  document_id: string;

  @Column({ type: 'enum', enum: AccessType })
  access: AccessType;

  @Column({ type: 'text', nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  accessed_at: Date;
}
