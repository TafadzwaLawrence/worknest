import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveType } from '../entities/leave-type.entity';
import { LeavePeriod } from '../entities/leave-period.entity';
import { EmployeeLeaveEntitlement } from '../entities/employee-leave-entitlement.entity';
import { LeaveRequest } from '../entities/leave-request.entity';
import { LeaveRequestApproval } from '../entities/leave-request-approval.entity';
import {
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  CreateLeavePeriodDto,
  UpdateLeavePeriodDto,
  CreateLeaveEntitlementDto,
  AdjustLeaveEntitlementDto,
  CreateLeaveRequestDto,
  UpdateLeaveRequestStatusDto,
  ApproveLeaveRequestDto,
} from '../dto/time-attendance.dto';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(LeaveType)
    private readonly leaveTypeRepo: Repository<LeaveType>,
    @InjectRepository(LeavePeriod)
    private readonly leavePeriodRepo: Repository<LeavePeriod>,
    @InjectRepository(EmployeeLeaveEntitlement)
    private readonly entitlementRepo: Repository<EmployeeLeaveEntitlement>,
    @InjectRepository(LeaveRequest)
    private readonly requestRepo: Repository<LeaveRequest>,
    @InjectRepository(LeaveRequestApproval)
    private readonly approvalRepo: Repository<LeaveRequestApproval>,
  ) {}

  // ─── Leave Types ──────────────────────────────────────────────────────────────

  findAllTypes(tenantId: string) {
    return this.leaveTypeRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findOneType(id: string, tenantId: string) {
    const t = await this.leaveTypeRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!t) throw new NotFoundException('Leave type not found');
    return t;
  }

  createType(dto: CreateLeaveTypeDto, tenantId: string) {
    return this.leaveTypeRepo.save(this.leaveTypeRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async updateType(id: string, dto: UpdateLeaveTypeDto, tenantId: string) {
    const t = await this.findOneType(id, tenantId);
    Object.assign(t, dto);
    return this.leaveTypeRepo.save(t);
  }

  async removeType(id: string, tenantId: string) {
    const t = await this.findOneType(id, tenantId);
    return this.leaveTypeRepo.remove(t);
  }

  // ─── Leave Periods ────────────────────────────────────────────────────────────

  findAllPeriods(tenantId: string) {
    return this.leavePeriodRepo.find({ where: { tenant_id: tenantId }, order: { start_date: 'DESC' } });
  }

  async findOnePeriod(id: string, tenantId: string) {
    const p = await this.leavePeriodRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!p) throw new NotFoundException('Leave period not found');
    return p;
  }

  createPeriod(dto: CreateLeavePeriodDto, tenantId: string) {
    return this.leavePeriodRepo.save(this.leavePeriodRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async updatePeriod(id: string, dto: UpdateLeavePeriodDto, tenantId: string) {
    const p = await this.findOnePeriod(id, tenantId);
    Object.assign(p, dto);
    return this.leavePeriodRepo.save(p);
  }

  // ─── Leave Entitlements ───────────────────────────────────────────────────────

  findEntitlements(employeeId: string, tenantId: string) {
    return this.entitlementRepo.find({ where: { employee_id: employeeId, tenant_id: tenantId } });
  }

  createEntitlement(dto: CreateLeaveEntitlementDto, tenantId: string) {
    return this.entitlementRepo.save(this.entitlementRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async adjustEntitlement(id: string, dto: AdjustLeaveEntitlementDto, tenantId: string) {
    const e = await this.entitlementRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!e) throw new NotFoundException('Entitlement not found');
    e.adjustment_days = Number(e.adjustment_days) + dto.adjustment_days;
    return this.entitlementRepo.save(e);
  }

  // ─── Leave Requests ───────────────────────────────────────────────────────────

  findRequests(tenantId: string, employeeId?: string) {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (employeeId) where['employee_id'] = employeeId;
    return this.requestRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async findOneRequest(id: string, tenantId: string) {
    const r = await this.requestRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!r) throw new NotFoundException('Leave request not found');
    return r;
  }

  createRequest(dto: CreateLeaveRequestDto, employeeId: string, tenantId: string) {
    return this.requestRepo.save(
      this.requestRepo.create({ ...dto, employee_id: employeeId, tenant_id: tenantId }),
    );
  }

  async updateRequestStatus(id: string, dto: UpdateLeaveRequestStatusDto, tenantId: string) {
    const r = await this.findOneRequest(id, tenantId);
    r.status = dto.status as any;
    return this.requestRepo.save(r);
  }

  async cancelRequest(id: string, employeeId: string, tenantId: string) {
    const r = await this.findOneRequest(id, tenantId);
    if (r.employee_id !== employeeId) throw new NotFoundException('Leave request not found');
    r.status = 'cancelled' as any;
    return this.requestRepo.save(r);
  }

  // ─── Leave Approvals ──────────────────────────────────────────────────────────

  findApprovals(requestId: string, tenantId: string) {
    return this.approvalRepo.find({
      where: { leave_request_id: requestId, tenant_id: tenantId },
      order: { approval_order: 'ASC' },
    });
  }

  async approveRequest(requestId: string, dto: ApproveLeaveRequestDto, approverId: string, tenantId: string) {
    const request = await this.findOneRequest(requestId, tenantId);
    const approval = this.approvalRepo.create({
      leave_request_id: requestId,
      approver_id: approverId,
      approval_order: 1,
      status: dto.status as any,
      comments: dto.comments,
      action_date: new Date(),
      tenant_id: tenantId,
    });
    await this.approvalRepo.save(approval);
    request.status = dto.status === 'approved' ? 'approved' as any : 'rejected' as any;
    return this.requestRepo.save(request);
  }
}
