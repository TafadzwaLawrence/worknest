import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftTemplate } from '../entities/shift-template.entity';
import { AttendanceRule } from '../entities/attendance-rule.entity';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { AttendanceCorrection } from '../entities/attendance-correction.entity';
import {
  CreateShiftTemplateDto,
  UpdateShiftTemplateDto,
  CreateAttendanceRuleDto,
  ClockInDto,
  ClockOutDto,
  UpdateAttendanceRecordDto,
  CreateAttendanceCorrectionDto,
  ReviewCorrectionDto,
} from '../dto/time-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(ShiftTemplate)
    private readonly shiftTemplateRepo: Repository<ShiftTemplate>,
    @InjectRepository(AttendanceRule)
    private readonly ruleRepo: Repository<AttendanceRule>,
    @InjectRepository(AttendanceRecord)
    private readonly recordRepo: Repository<AttendanceRecord>,
    @InjectRepository(AttendanceCorrection)
    private readonly correctionRepo: Repository<AttendanceCorrection>,
  ) {}

  // ─── Shift Templates ──────────────────────────────────────────────────────────

  findAllShiftTemplates(tenantId: string) {
    return this.shiftTemplateRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findOneShiftTemplate(id: string, tenantId: string) {
    const t = await this.shiftTemplateRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!t) throw new NotFoundException('Shift template not found');
    return t;
  }

  createShiftTemplate(dto: CreateShiftTemplateDto, tenantId: string) {
    return this.shiftTemplateRepo.save(this.shiftTemplateRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async updateShiftTemplate(id: string, dto: UpdateShiftTemplateDto, tenantId: string) {
    const t = await this.findOneShiftTemplate(id, tenantId);
    Object.assign(t, dto);
    return this.shiftTemplateRepo.save(t);
  }

  async removeShiftTemplate(id: string, tenantId: string) {
    const t = await this.findOneShiftTemplate(id, tenantId);
    return this.shiftTemplateRepo.remove(t);
  }

  // ─── Attendance Rules ─────────────────────────────────────────────────────────

  findAllRules(tenantId: string) {
    return this.ruleRepo.find({ where: { tenant_id: tenantId } });
  }

  async findOneRule(id: string, tenantId: string) {
    const r = await this.ruleRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!r) throw new NotFoundException('Attendance rule not found');
    return r;
  }

  createRule(dto: CreateAttendanceRuleDto, tenantId: string) {
    return this.ruleRepo.save(this.ruleRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async updateRule(id: string, dto: Partial<CreateAttendanceRuleDto>, tenantId: string) {
    const r = await this.findOneRule(id, tenantId);
    Object.assign(r, dto);
    return this.ruleRepo.save(r);
  }

  async removeRule(id: string, tenantId: string) {
    const r = await this.findOneRule(id, tenantId);
    return this.ruleRepo.remove(r);
  }

  // ─── Attendance Records ───────────────────────────────────────────────────────

  findRecords(tenantId: string, employeeId?: string) {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (employeeId) where['employee_id'] = employeeId;
    return this.recordRepo.find({ where, order: { record_date: 'DESC' } });
  }

  async findOneRecord(id: string, tenantId: string) {
    const r = await this.recordRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!r) throw new NotFoundException('Attendance record not found');
    return r;
  }

  clockIn(dto: ClockInDto, tenantId: string) {
    return this.recordRepo.save(
      this.recordRepo.create({
        ...dto,
        actual_clock_in: new Date(),
        tenant_id: tenantId,
      }),
    );
  }

  async clockOut(id: string, dto: ClockOutDto, tenantId: string) {
    const record = await this.findOneRecord(id, tenantId);
    record.actual_clock_out = new Date();
    if (dto.clock_out_location) record.clock_out_location = dto.clock_out_location;
    return this.recordRepo.save(record);
  }

  async updateRecord(id: string, dto: UpdateAttendanceRecordDto, tenantId: string, verifierId?: string) {
    const record = await this.findOneRecord(id, tenantId);
    Object.assign(record, dto);
    if (dto.is_verified && verifierId) {
      record.verified_by = verifierId;
      record.verified_at = new Date();
    }
    return this.recordRepo.save(record);
  }

  // ─── Attendance Corrections ───────────────────────────────────────────────────

  findCorrections(tenantId: string, employeeId?: string) {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (employeeId) where['employee_id'] = employeeId;
    return this.correctionRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async findOneCorrection(id: string, tenantId: string) {
    const c = await this.correctionRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!c) throw new NotFoundException('Correction not found');
    return c;
  }

  createCorrection(dto: CreateAttendanceCorrectionDto, employeeId: string, tenantId: string) {
    return this.correctionRepo.save(
      this.correctionRepo.create({ ...dto, employee_id: employeeId, tenant_id: tenantId }),
    );
  }

  async reviewCorrection(id: string, dto: ReviewCorrectionDto, approverId: string, tenantId: string) {
    const c = await this.findOneCorrection(id, tenantId);
    c.status = dto.status as any;
    c.approver_id = approverId;
    c.approval_date = new Date();
    if (dto.approval_comments) c.approval_comments = dto.approval_comments;
    return this.correctionRepo.save(c);
  }
}
