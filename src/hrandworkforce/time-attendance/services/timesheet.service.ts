import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Timesheet } from '../entities/timesheet.entity';
import { OvertimeRequest } from '../entities/overtime-request.entity';
import {
  CreateTimesheetDto,
  UpdateTimesheetStatusDto,
  CreateOvertimeRequestDto,
  ReviewOvertimeDto,
} from '../dto/time-attendance.dto';

@Injectable()
export class TimesheetService {
  constructor(
    @InjectRepository(Timesheet)
    private readonly timesheetRepo: Repository<Timesheet>,
    @InjectRepository(OvertimeRequest)
    private readonly overtimeRepo: Repository<OvertimeRequest>,
  ) {}

  // ─── Timesheets ───────────────────────────────────────────────────────────────

  findAll(tenantId: string, employeeId?: string) {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (employeeId) where['employee_id'] = employeeId;
    return this.timesheetRepo.find({ where, order: { period_start_date: 'DESC' } });
  }

  async findOne(id: string, tenantId: string) {
    const t = await this.timesheetRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!t) throw new NotFoundException('Timesheet not found');
    return t;
  }

  create(dto: CreateTimesheetDto, tenantId: string) {
    return this.timesheetRepo.save(this.timesheetRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async submit(id: string, tenantId: string) {
    const t = await this.findOne(id, tenantId);
    t.status = 'submitted' as any;
    return this.timesheetRepo.save(t);
  }

  async updateStatus(id: string, dto: UpdateTimesheetStatusDto, approverId: string, tenantId: string) {
    const t = await this.findOne(id, tenantId);
    t.status = dto.status as any;
    if (dto.status === 'approved') {
      t.approved_by = approverId;
      t.approved_at = new Date();
    } else if (dto.status === 'processed') {
      t.processed_by = approverId;
      t.processed_at = new Date();
    }
    return this.timesheetRepo.save(t);
  }

  // ─── Overtime Requests ────────────────────────────────────────────────────────

  findOvertimeRequests(tenantId: string, employeeId?: string) {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (employeeId) where['employee_id'] = employeeId;
    return this.overtimeRepo.find({ where, order: { date: 'DESC' } });
  }

  async findOneOvertime(id: string, tenantId: string) {
    const o = await this.overtimeRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!o) throw new NotFoundException('Overtime request not found');
    return o;
  }

  createOvertime(dto: CreateOvertimeRequestDto, employeeId: string, tenantId: string) {
    return this.overtimeRepo.save(
      this.overtimeRepo.create({
        ...dto,
        start_time: new Date(dto.start_time),
        end_time: new Date(dto.end_time),
        employee_id: employeeId,
        tenant_id: tenantId,
      }),
    );
  }

  async reviewOvertime(id: string, dto: ReviewOvertimeDto, approverId: string, tenantId: string) {
    const o = await this.findOneOvertime(id, tenantId);
    o.status = dto.status as any;
    o.approved_by = approverId;
    o.approved_at = new Date();
    if (dto.calculated_amount !== undefined) o.calculated_amount = dto.calculated_amount;
    return this.overtimeRepo.save(o);
  }
}
