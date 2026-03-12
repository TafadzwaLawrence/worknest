import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('recognition_tags')
@Unique(['tenant_id', 'recognition_id', 'tag'])
export class RecognitionTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  recognition_id: string;

  @Column({ type: 'text' })
  tag: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
