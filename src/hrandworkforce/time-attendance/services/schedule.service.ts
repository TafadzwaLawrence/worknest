import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import { ScheduledShift } from '../entities/scheduled-shift.entity';
import { ShiftSwap } from '../entities/shift-swap.entity';
import { TimeOffRequest } from '../entities/time-off-request.entity';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  CreateScheduledShiftDto,
  UpdateShiftStatusDto,
  CreateShiftSwapDto,
  ReviewSwapDto,
  CreateTimeOffRequestDto,
  ReviewTimeOffDto,
} from '../dto/time-attendance.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(ScheduledShift)
    private readonly shiftRepo: Repository<ScheduledShift>,
    @InjectRepository(ShiftSwap)
    private readonly swapRepo: Repository<ShiftSwap>,
    @InjectRepository(TimeOffRequest)
    private readonly timeOffRepo: Repository<TimeOffRequest>,
  ) {}

  // ─── Schedules ────────────────────────────────────────────────────────────────

  findAll(tenantId: string) {
    return this.scheduleRepo.find({ where: { tenant_id: tenantId }, order: { period_start_date: 'DESC' } });
  }

  async findOne(id: string, tenantId: string) {
    const s = await this.scheduleRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!s) throw new NotFoundException('Schedule not found');
    return s;
  }

  create(dto: CreateScheduleDto, tenantId: string, createdBy: string) {
    return this.scheduleRepo.save(
      this.scheduleRepo.create({ ...dto, tenant_id: tenantId, created_by: createdBy }),
    );
  }

  async update(id: string, dto: UpdateScheduleDto, tenantId: string) {
    const s = await this.findOne(id, tenantId);
    Object.assign(s, dto);
    return this.scheduleRepo.save(s);
  }

  async publish(id: string, publisherId: string, tenantId: string) {
    const s = await this.findOne(id, tenantId);
    s.is_published = true;
    s.status = 'published' as any;
    s.published_by = publisherId;
    s.published_at = new Date();
    return this.scheduleRepo.save(s);
  }

  async remove(id: string, tenantId: string) {
    const s = await this.findOne(id, tenantId);
    return this.scheduleRepo.remove(s);
  }

  // ─── Scheduled Shifts ─────────────────────────────────────────────────────────

  findShifts(scheduleId: string, tenantId: string) {
    return this.shiftRepo.find({
      where: { schedule_id: scheduleId, tenant_id: tenantId },
      order: { shift_date: 'ASC', start_time: 'ASC' },
    });
  }

  findShiftsByEmployee(employeeId: string, tenantId: string) {
    return this.shiftRepo.find({
      where: { employee_id: employeeId, tenant_id: tenantId },
      order: { shift_date: 'ASC' },
    });
  }

  async findOneShift(id: string, tenantId: string) {
    const s = await this.shiftRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!s) throw new NotFoundException('Scheduled shift not found');
    return s;
  }

  createShift(scheduleId: string, dto: CreateScheduledShiftDto, tenantId: string) {
    return this.shiftRepo.save(
      this.shiftRepo.create({
        ...dto,
        start_time: new Date(dto.start_time),
        end_time: new Date(dto.end_time),
        schedule_id: scheduleId,
        tenant_id: tenantId,
      }),
    );
  }

  async updateShiftStatus(id: string, dto: UpdateShiftStatusDto, tenantId: string) {
    const s = await this.findOneShift(id, tenantId);
    s.status = dto.status as any;
    return this.shiftRepo.save(s);
  }

  async approveShift(id: string, approverId: string, tenantId: string) {
    const s = await this.findOneShift(id, tenantId);
    s.is_approved = true;
    s.approved_by = approverId;
    s.approved_at = new Date();
    return this.shiftRepo.save(s);
  }

  async removeShift(id: string, tenantId: string) {
    const s = await this.findOneShift(id, tenantId);
    return this.shiftRepo.remove(s);
  }

  // ─── Shift Swaps ──────────────────────────────────────────────────────────────

  findSwaps(tenantId: string, employeeId?: string) {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (employeeId) where['original_employee_id'] = employeeId;
    return this.swapRepo.find({ where, order: { created_at: 'DESC' } });
  }

  createSwap(dto: CreateShiftSwapDto, employeeId: string, tenantId: string) {
    return this.swapRepo.save(
      this.swapRepo.create({ ...dto, original_employee_id: employeeId, tenant_id: tenantId }),
    );
  }

  async reviewSwap(id: string, dto: ReviewSwapDto, approverId: string, tenantId: string) {
    const swap = await this.swapRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!swap) throw new NotFoundException('Shift swap not found');
    swap.status = dto.status as any;
    swap.approved_by = approverId;
    swap.approved_at = new Date();
    return this.swapRepo.save(swap);
  }

  // ─── Time Off Requests ────────────────────────────────────────────────────────

  findTimeOffRequests(tenantId: string, employeeId?: string) {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (employeeId) where['employee_id'] = employeeId;
    return this.timeOffRepo.find({ where, order: { created_at: 'DESC' } });
  }

  createTimeOff(dto: CreateTimeOffRequestDto, employeeId: string, tenantId: string) {
    return this.timeOffRepo.save(
      this.timeOffRepo.create({ ...dto, employee_id: employeeId, tenant_id: tenantId }),
    );
  }

  async reviewTimeOff(id: string, dto: ReviewTimeOffDto, approverId: string, tenantId: string) {
    const r = await this.timeOffRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!r) throw new NotFoundException('Time off request not found');
    r.status = dto.status as any;
    r.approved_by = approverId;
    r.approved_at = new Date();
    return this.timeOffRepo.save(r);
  }
}
