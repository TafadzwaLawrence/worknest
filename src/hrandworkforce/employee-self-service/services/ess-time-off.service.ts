import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EssTimeOffDraft } from '../entities/ess-time-off-draft.entity.js';
import { EssTimeOffPortal } from '../entities/ess-time-off-portal.entity.js';
import { SaveTimeOffDraftDto, CreateTimeOffPortalDto } from '../dto/ess.dto.js';

@Injectable()
export class EssTimeOffService {
  constructor(
    @InjectRepository(EssTimeOffDraft)
    private readonly draftRepo: Repository<EssTimeOffDraft>,
    @InjectRepository(EssTimeOffPortal)
    private readonly portalRepo: Repository<EssTimeOffPortal>,
  ) {}

  async saveDraft(tenantId: string, dto: SaveTimeOffDraftDto): Promise<EssTimeOffDraft> {
    const draft = this.draftRepo.create({ tenant_id: tenantId, ...dto });
    return this.draftRepo.save(draft);
  }

  async findAllDrafts(tenantId: string): Promise<EssTimeOffDraft[]> {
    return this.draftRepo.find({
      where: { tenant_id: tenantId },
      order: { updated_at: 'DESC' },
    });
  }

  async getDrafts(tenantId: string, employeeId: string): Promise<EssTimeOffDraft[]> {
    return this.draftRepo.find({
      where: { tenant_id: tenantId, employee_id: employeeId },
      order: { updated_at: 'DESC' },
    });
  }

  async getDraftById(tenantId: string, id: string): Promise<EssTimeOffDraft> {
    const draft = await this.draftRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!draft) throw new NotFoundException(`Draft ${id} not found`);
    return draft;
  }

  async updateDraft(tenantId: string, id: string, dto: SaveTimeOffDraftDto): Promise<EssTimeOffDraft> {
    const draft = await this.getDraftById(tenantId, id);
    Object.assign(draft, dto);
    return this.draftRepo.save(draft);
  }

  async deleteDraft(tenantId: string, id: string): Promise<void> {
    const draft = await this.getDraftById(tenantId, id);
    await this.draftRepo.remove(draft);
  }

  async createPortalRecord(tenantId: string, dto: CreateTimeOffPortalDto): Promise<EssTimeOffPortal> {
    const record = this.portalRepo.create({ tenant_id: tenantId, ...dto });
    return this.portalRepo.save(record);
  }

  async getPortalRecordByLeaveRequest(tenantId: string, leaveRequestId: string): Promise<EssTimeOffPortal | null> {
    return this.portalRepo.findOne({
      where: { tenant_id: tenantId, leave_request_id: leaveRequestId },
    });
  }

  async getEmployeeTimeOffPortalRecords(tenantId: string, employeeId: string): Promise<EssTimeOffPortal[]> {
    return this.portalRepo.find({
      where: { tenant_id: tenantId, employee_id: employeeId },
      order: { created_at: 'DESC' },
    });
  }
}
