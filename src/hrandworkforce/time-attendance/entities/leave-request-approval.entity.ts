import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../core/entities/tenant.entity';
import { Employee } from '../../core/entities/employee.entity';
import { LeaveRequest } from './leave-request.entity';
import { ApprovalStatus } from '../time-attendance.enums';

@Entity('leave_request_approvals')
export class LeaveRequestApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  leave_request_id: string;

  @ManyToOne(() => LeaveRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leave_request_id' })
  leaveRequest: LeaveRequest;

  @Column({ type: 'uuid' })
  approver_id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'approver_id' })
  approver: Employee;

  @Column({ type: 'int' })
  approval_order: number;

  @Column({ type: 'enum', enum: ApprovalStatus })
  status: ApprovalStatus;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  action_date: Date | null;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
