import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EssRequiredAcknowledgment } from '../entities/ess-required-acknowledgment.entity.js';
import { EssAcknowledgment } from '../entities/ess-acknowledgment.entity.js';
import { EssDocumentAccess } from '../entities/ess-document-access.entity.js';
import { EssAttachment } from '../entities/ess-attachment.entity.js';
import { EssAckStatus } from '../ess.enums.js';
import {
  CreateRequiredAcknowledgmentDto,
  AcknowledgeDocumentDto,
  WaiveAcknowledgmentDto,
  LogDocumentAccessDto,
  AddAttachmentDto,
} from '../dto/ess.dto.js';

@Injectable()
export class EssDocumentService {
  constructor(
    @InjectRepository(EssRequiredAcknowledgment)
    private readonly requiredAckRepo: Repository<EssRequiredAcknowledgment>,
    @InjectRepository(EssAcknowledgment)
    private readonly ackRepo: Repository<EssAcknowledgment>,
    @InjectRepository(EssDocumentAccess)
    private readonly accessRepo: Repository<EssDocumentAccess>,
    @InjectRepository(EssAttachment)
    private readonly attachmentRepo: Repository<EssAttachment>,
  ) {}

  async createRequiredAcknowledgment(
    tenantId: string,
    dto: CreateRequiredAcknowledgmentDto,
    userId: string,
  ): Promise<EssRequiredAcknowledgment> {
    const record = this.requiredAckRepo.create({ tenant_id: tenantId, created_by: userId, ...dto });
    return this.requiredAckRepo.save(record);
  }

  async findAllRequiredAcknowledgments(tenantId: string): Promise<EssRequiredAcknowledgment[]> {
    return this.requiredAckRepo.find({ where: { tenant_id: tenantId } });
  }

  async acknowledgeDocument(tenantId: string, dto: AcknowledgeDocumentDto): Promise<EssAcknowledgment> {
    let ack = await this.ackRepo.findOne({
      where: { tenant_id: tenantId, employee_id: dto.employee_id, document_id: dto.document_id },
    });
    if (!ack) {
      ack = this.ackRepo.create({ tenant_id: tenantId, ...dto });
    }
    ack.status = EssAckStatus.ACKNOWLEDGED;
    ack.acked_at = new Date();
    if (dto.ack_version) ack.ack_version = dto.ack_version;
    if (dto.comments) ack.comments = dto.comments;
    return this.ackRepo.save(ack);
  }

  async waiveAcknowledgment(tenantId: string, dto: WaiveAcknowledgmentDto): Promise<EssAcknowledgment> {
    let ack = await this.ackRepo.findOne({
      where: { tenant_id: tenantId, employee_id: dto.employee_id, document_id: dto.document_id },
    });
    if (!ack) {
      ack = this.ackRepo.create({ tenant_id: tenantId, employee_id: dto.employee_id, document_id: dto.document_id });
    }
    ack.status = EssAckStatus.WAIVED;
    if (dto.comments) ack.comments = dto.comments;
    return this.ackRepo.save(ack);
  }

  async getEmployeeAcknowledgments(tenantId: string, employeeId: string): Promise<EssAcknowledgment[]> {
    return this.ackRepo.find({ where: { tenant_id: tenantId, employee_id: employeeId } });
  }

  async logDocumentAccess(tenantId: string, dto: LogDocumentAccessDto): Promise<EssDocumentAccess> {
    const log = this.accessRepo.create({ tenant_id: tenantId, ...dto });
    return this.accessRepo.save(log);
  }

  async getDocumentAccessLogs(tenantId: string, employeeId: string): Promise<EssDocumentAccess[]> {
    return this.accessRepo.find({
      where: { tenant_id: tenantId, employee_id: employeeId },
      order: { accessed_at: 'DESC' },
    });
  }

  async addAttachment(tenantId: string, dto: AddAttachmentDto, userId: string): Promise<EssAttachment> {
    const attachment = this.attachmentRepo.create({ tenant_id: tenantId, created_by: userId, ...dto });
    return this.attachmentRepo.save(attachment);
  }

  async getAttachments(tenantId: string, ownerType: string, ownerId: string): Promise<EssAttachment[]> {
    return this.attachmentRepo.find({
      where: { tenant_id: tenantId, owner_type: ownerType as any, owner_id: ownerId },
    });
  }
}
