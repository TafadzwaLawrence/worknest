import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EssProfileRequest } from '../entities/ess-profile-request.entity.js';
import { EssProfileRequestItem } from '../entities/ess-profile-request-item.entity.js';
import { EssRequestStatus } from '../ess.enums.js';
import {
  CreateProfileRequestDto,
  ReviewProfileRequestDto,
  AddProfileRequestItemDto,
} from '../dto/ess.dto.js';

@Injectable()
export class EssProfileService {
  constructor(
    @InjectRepository(EssProfileRequest)
    private readonly requestRepo: Repository<EssProfileRequest>,
    @InjectRepository(EssProfileRequestItem)
    private readonly itemRepo: Repository<EssProfileRequestItem>,
  ) {}

  async createRequest(tenantId: string, dto: CreateProfileRequestDto): Promise<EssProfileRequest> {
    const request = this.requestRepo.create({ tenant_id: tenantId, ...dto });
    return this.requestRepo.save(request);
  }

  async findAllRequests(tenantId: string): Promise<EssProfileRequest[]> {
    return this.requestRepo.find({ where: { tenant_id: tenantId }, order: { submitted_at: 'DESC' } });
  }

  async findRequestsByEmployee(tenantId: string, employeeId: string): Promise<EssProfileRequest[]> {
    return this.requestRepo.find({
      where: { tenant_id: tenantId, employee_id: employeeId },
      order: { submitted_at: 'DESC' },
    });
  }

  async findRequestById(tenantId: string, id: string): Promise<EssProfileRequest> {
    const request = await this.requestRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!request) throw new NotFoundException(`Profile request ${id} not found`);
    return request;
  }

  async reviewRequest(
    tenantId: string,
    id: string,
    dto: ReviewProfileRequestDto,
    reviewerId: string,
  ): Promise<EssProfileRequest> {
    const request = await this.findRequestById(tenantId, id);
    request.status = dto.status;
    request.reviewed_by = reviewerId;
    request.reviewed_at = new Date();
    if (dto.review_comments) request.review_comments = dto.review_comments;
    if (dto.effective_date) request.effective_date = dto.effective_date;
    return this.requestRepo.save(request);
  }

  async cancelRequest(tenantId: string, id: string): Promise<EssProfileRequest> {
    const request = await this.findRequestById(tenantId, id);
    request.status = EssRequestStatus.CANCELLED;
    return this.requestRepo.save(request);
  }

  async deleteRequest(tenantId: string, id: string): Promise<void> {
    const request = await this.findRequestById(tenantId, id);
    await this.requestRepo.softRemove(request);
  }

  async addRequestItem(tenantId: string, dto: AddProfileRequestItemDto): Promise<EssProfileRequestItem> {
    const item = this.itemRepo.create({ tenant_id: tenantId, ...dto });
    return this.itemRepo.save(item);
  }

  async getRequestItems(tenantId: string, requestId: string): Promise<EssProfileRequestItem[]> {
    return this.itemRepo.find({ where: { tenant_id: tenantId, request_id: requestId } });
  }
}
