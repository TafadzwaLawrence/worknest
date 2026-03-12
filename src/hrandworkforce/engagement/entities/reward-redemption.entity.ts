import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reward_redemptions')
export class RewardRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'uuid' })
  reward_id: string;

  @Column({ type: 'int' })
  points_used: number;

  @Column({ type: 'text', default: 'requested' })
  status: string; // 'requested', 'approved', 'fulfilled', 'cancelled'

  @Column({ type: 'timestamptz', default: () => 'now()' })
  requested_at: Date;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  fulfilled_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
