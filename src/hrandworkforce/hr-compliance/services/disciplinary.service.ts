import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DisciplinaryCase } from '../entities/disciplinary-case.entity.js';
import { DisciplinaryDocument } from '../entities/disciplinary-document.entity.js';
import { PipRecord } from '../entities/pip-record.entity.js';
import {
  CreateDisciplinaryCaseDto,
  UpdateDisciplinaryCaseDto,
  AttachDocumentDto,
  CreatePipRecordDto,
  UpdatePipRecordDto,
} from '../dto/hr-compliance.dto.js';

@Injectable()
export class DisciplinaryService {
  constructor(
    @InjectRepository(DisciplinaryCase)
    private readonly caseRepo: Repository<DisciplinaryCase>,
    @InjectRepository(DisciplinaryDocument)
    private readonly docRepo: Repository<DisciplinaryDocument>,
    @InjectRepository(PipRecord)
    private readonly pipRepo: Repository<PipRecord>,
  ) {}

  // ── Cases ─────────────────────────────────────────────────────────────────

  async createCase(
    tenantId: string,
    userId: string,
    dto: CreateDisciplinaryCaseDto,
  ): Promise<DisciplinaryCase> {
    const record = this.caseRepo.create({
      ...dto,
      tenant_id: tenantId,
      raised_by: dto.raised_by ?? userId,
    });
    return this.caseRepo.save(record);
  }

  async findAllCases(tenantId: string): Promise<DisciplinaryCase[]> {
    return this.caseRepo.find({
      where: { tenant_id: tenantId },
      order: { incident_date: 'DESC' },
    });
  }

  async findCasesByEmployee(
    tenantId: string,
    employeeId: string,
  ): Promise<DisciplinaryCase[]> {
    return this.caseRepo.find({
      where: { tenant_id: tenantId, employee_id: employeeId },
      order: { incident_date: 'DESC' },
    });
  }

  async findOneCase(tenantId: string, id: string): Promise<DisciplinaryCase> {
    const record = await this.caseRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!record) throw new NotFoundException(`Disciplinary case ${id} not found`);
    return record;
  }

  async updateCase(
    tenantId: string,
    id: string,
    dto: UpdateDisciplinaryCaseDto,
  ): Promise<DisciplinaryCase> {
    const record = await this.findOneCase(tenantId, id);
    Object.assign(record, dto);
    return this.caseRepo.save(record);
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  async attachDocument(
    tenantId: string,
    caseId: string,
    userId: string,
    dto: AttachDocumentDto,
  ): Promise<DisciplinaryDocument> {
    await this.findOneCase(tenantId, caseId);
    const attachment = this.docRepo.create({
      tenant_id: tenantId,
      case_id: caseId,
      document_id: dto.document_id,
      uploaded_by: userId,
    });
    return this.docRepo.save(attachment);
  }

  async listDocuments(
    tenantId: string,
    caseId: string,
  ): Promise<DisciplinaryDocument[]> {
    await this.findOneCase(tenantId, caseId);
    return this.docRepo.find({ where: { tenant_id: tenantId, case_id: caseId } });
  }

  // ── PIP Records ───────────────────────────────────────────────────────────

  async createPip(
    tenantId: string,
    userId: string,
    dto: CreatePipRecordDto,
  ): Promise<PipRecord> {
    const record = this.pipRepo.create({
      ...dto,
      tenant_id: tenantId,
      created_by: userId,
    });
    return this.pipRepo.save(record);
  }

  async findAllPips(tenantId: string): Promise<PipRecord[]> {
    return this.pipRepo.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async findPipsByEmployee(
    tenantId: string,
    employeeId: string,
  ): Promise<PipRecord[]> {
    return this.pipRepo.find({
      where: { tenant_id: tenantId, employee_id: employeeId },
      order: { start_date: 'DESC' },
    });
  }

  async findOnePip(tenantId: string, id: string): Promise<PipRecord> {
    const record = await this.pipRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!record) throw new NotFoundException(`PIP record ${id} not found`);
    return record;
  }

  async updatePip(
    tenantId: string,
    id: string,
    dto: UpdatePipRecordDto,
  ): Promise<PipRecord> {
    const record = await this.findOnePip(tenantId, id);
    Object.assign(record, dto);
    return this.pipRepo.save(record);
  }
}
