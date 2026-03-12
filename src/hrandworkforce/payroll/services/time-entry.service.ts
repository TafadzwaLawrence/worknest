import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeEntry } from '../entities/time-entry.entity.js';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from '../dto/payroll.dto.js';

@Injectable()
export class TimeEntryService {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepo: Repository<TimeEntry>,
  ) {}

  findAll(tenantId: string, employeeId?: string, entryDate?: string) {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (employeeId) where['employee_id'] = employeeId;
    if (entryDate) where['entry_date'] = entryDate;
    return this.timeEntryRepo.find({ where, order: { entry_date: 'DESC', start_time: 'DESC' } });
  }

  async findOne(id: string, tenantId: string) {
    const e = await this.timeEntryRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!e) throw new NotFoundException('Time entry not found');
    return e;
  }

  create(dto: CreateTimeEntryDto, tenantId: string, createdBy: string) {
    return this.timeEntryRepo.save(
      this.timeEntryRepo.create({
        ...dto,
        start_time: new Date(dto.start_time),
        end_time: dto.end_time ? new Date(dto.end_time) : undefined,
        tenant_id: tenantId,
        created_by: createdBy,
      }),
    );
  }

  async update(id: string, dto: UpdateTimeEntryDto, tenantId: string) {
    const e = await this.findOne(id, tenantId);
    const updates: Partial<TimeEntry> = { ...dto } as Partial<TimeEntry>;
    if (dto.start_time) updates.start_time = new Date(dto.start_time);
    if (dto.end_time) updates.end_time = new Date(dto.end_time);
    Object.assign(e, updates);
    return this.timeEntryRepo.save(e);
  }

  async approve(id: string, approverId: string, tenantId: string) {
    const e = await this.findOne(id, tenantId);
    e.is_approved = true;
    e.approved_by = approverId;
    e.approved_at = new Date();
    return this.timeEntryRepo.save(e);
  }

  async remove(id: string, tenantId: string) {
    const e = await this.findOne(id, tenantId);
    return this.timeEntryRepo.softRemove(e);
  }
}
