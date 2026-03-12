import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { JobRequisition } from '../entities/job-requisition.entity.js';
import { JobPosting } from '../entities/job-posting.entity.js';
import { CreateJobRequisitionDto } from '../dto/create-job-requisition.dto.js';
import { CreateJobPostingDto } from '../dto/create-job-posting.dto.js';
import { PaginationDto } from '../../core/dto/pagination.dto.js';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(JobRequisition)
    private readonly reqRepo: Repository<JobRequisition>,
    @InjectRepository(JobPosting)
    private readonly postingRepo: Repository<JobPosting>,
  ) {}

  // ─── Requisitions ────────────────────────────────────────────────

  async findAllRequisitions(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.reqRepo.findAndCount({
      where: { tenant_id: tenantId, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOneRequisition(id: string, tenantId: string): Promise<JobRequisition> {
    const req = await this.reqRepo.findOne({ where: { id, tenant_id: tenantId, deleted_at: IsNull() } });
    if (!req) throw new NotFoundException(`Job requisition ${id} not found`);
    return req;
  }

  async createRequisition(dto: CreateJobRequisitionDto, tenantId: string, userId: string): Promise<JobRequisition> {
    if (dto.reference_code) {
      const exists = await this.reqRepo.findOne({
        where: { tenant_id: tenantId, reference_code: dto.reference_code, deleted_at: IsNull() },
      });
      if (exists) throw new ConflictException(`Reference code '${dto.reference_code}' already exists`);
    }
    return this.reqRepo.save(
      this.reqRepo.create({ ...dto, tenant_id: tenantId, created_by: userId }),
    );
  }

  async updateRequisition(id: string, dto: Partial<CreateJobRequisitionDto>, tenantId: string, userId: string): Promise<JobRequisition> {
    const req = await this.findOneRequisition(id, tenantId);
    Object.assign(req, dto, { updated_by: userId });
    return this.reqRepo.save(req);
  }

  async removeRequisition(id: string, tenantId: string): Promise<void> {
    const req = await this.findOneRequisition(id, tenantId);
    await this.reqRepo.softRemove(req);
  }

  // ─── Postings ────────────────────────────────────────────────────

  async findAllPostings(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.postingRepo.findAndCount({
      where: { tenant_id: tenantId, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOnePosting(id: string, tenantId: string): Promise<JobPosting> {
    const posting = await this.postingRepo.findOne({ where: { id, tenant_id: tenantId, deleted_at: IsNull() } });
    if (!posting) throw new NotFoundException(`Job posting ${id} not found`);
    return posting;
  }

  async createPosting(dto: CreateJobPostingDto, tenantId: string, userId: string): Promise<JobPosting> {
    return this.postingRepo.save(
      this.postingRepo.create({
        ...dto,
        tenant_id: tenantId,
        created_by: userId,
        publish_at: dto.publish_at ? new Date(dto.publish_at) : undefined,
        expire_at: dto.expire_at ? new Date(dto.expire_at) : undefined,
      }),
    );
  }

  async updatePosting(id: string, dto: Partial<CreateJobPostingDto>, tenantId: string, userId: string): Promise<JobPosting> {
    const posting = await this.findOnePosting(id, tenantId);
    Object.assign(posting, dto, {
      updated_by: userId,
      publish_at: dto.publish_at ? new Date(dto.publish_at) : posting.publish_at,
      expire_at: dto.expire_at ? new Date(dto.expire_at) : posting.expire_at,
    });
    return this.postingRepo.save(posting);
  }

  async removePosting(id: string, tenantId: string): Promise<void> {
    const posting = await this.findOnePosting(id, tenantId);
    await this.postingRepo.softRemove(posting);
  }
}
