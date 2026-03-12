import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewCycle } from '../entities/review-cycle.entity.js';
import { ReviewTemplate } from '../entities/review-template.entity.js';
import { PerformanceReview } from '../entities/performance-review.entity.js';
import { ReviewParticipant } from '../entities/review-participant.entity.js';
import { ReviewResponse } from '../entities/review-response.entity.js';
import {
  CreateReviewCycleDto,
  UpdateReviewCycleDto,
  CreateReviewTemplateDto,
  UpdateReviewTemplateDto,
  CreatePerformanceReviewDto,
  UpdatePerformanceReviewDto,
  CreateReviewParticipantDto,
  UpdateReviewParticipantDto,
  CreateReviewResponseDto,
  UpdateReviewResponseDto,
} from '../dto/performance.dto.js';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewCycle)
    private readonly reviewCycleRepo: Repository<ReviewCycle>,
    @InjectRepository(ReviewTemplate)
    private readonly reviewTemplateRepo: Repository<ReviewTemplate>,
    @InjectRepository(PerformanceReview)
    private readonly performanceReviewRepo: Repository<PerformanceReview>,
    @InjectRepository(ReviewParticipant)
    private readonly reviewParticipantRepo: Repository<ReviewParticipant>,
    @InjectRepository(ReviewResponse)
    private readonly reviewResponseRepo: Repository<ReviewResponse>,
  ) {}

  // ─── Review Cycles ──────────────────────────────────────────────────────────

  async createCycle(tenantId: string, dto: CreateReviewCycleDto, userId: string): Promise<ReviewCycle> {
    const cycle = this.reviewCycleRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.reviewCycleRepo.save(cycle);
  }

  async findAllCycles(tenantId: string): Promise<ReviewCycle[]> {
    return this.reviewCycleRepo.find({ where: { tenant_id: tenantId }, order: { created_at: 'DESC' } });
  }

  async findCycle(tenantId: string, id: string): Promise<ReviewCycle> {
    const cycle = await this.reviewCycleRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!cycle) throw new NotFoundException('Review cycle not found');
    return cycle;
  }

  async updateCycle(tenantId: string, id: string, dto: UpdateReviewCycleDto): Promise<ReviewCycle> {
    const cycle = await this.findCycle(tenantId, id);
    Object.assign(cycle, dto);
    return this.reviewCycleRepo.save(cycle);
  }

  async removeCycle(tenantId: string, id: string): Promise<void> {
    const cycle = await this.findCycle(tenantId, id);
    await this.reviewCycleRepo.softRemove(cycle);
  }

  // ─── Review Templates ───────────────────────────────────────────────────────

  async createTemplate(tenantId: string, dto: CreateReviewTemplateDto, userId: string): Promise<ReviewTemplate> {
    const tpl = this.reviewTemplateRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.reviewTemplateRepo.save(tpl);
  }

  async findAllTemplates(tenantId: string): Promise<ReviewTemplate[]> {
    return this.reviewTemplateRepo.find({ where: { tenant_id: tenantId }, order: { created_at: 'DESC' } });
  }

  async findTemplate(tenantId: string, id: string): Promise<ReviewTemplate> {
    const tpl = await this.reviewTemplateRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!tpl) throw new NotFoundException('Review template not found');
    return tpl;
  }

  async updateTemplate(tenantId: string, id: string, dto: UpdateReviewTemplateDto): Promise<ReviewTemplate> {
    const tpl = await this.findTemplate(tenantId, id);
    Object.assign(tpl, dto);
    return this.reviewTemplateRepo.save(tpl);
  }

  async removeTemplate(tenantId: string, id: string): Promise<void> {
    const tpl = await this.findTemplate(tenantId, id);
    await this.reviewTemplateRepo.softRemove(tpl);
  }

  // ─── Performance Reviews ────────────────────────────────────────────────────

  async createReview(tenantId: string, dto: CreatePerformanceReviewDto, userId: string): Promise<PerformanceReview> {
    const review = this.performanceReviewRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.performanceReviewRepo.save(review);
  }

  async findAllReviews(tenantId: string): Promise<PerformanceReview[]> {
    return this.performanceReviewRepo.find({ where: { tenant_id: tenantId }, order: { created_at: 'DESC' } });
  }

  async findReview(tenantId: string, id: string): Promise<PerformanceReview> {
    const review = await this.performanceReviewRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!review) throw new NotFoundException('Performance review not found');
    return review;
  }

  async updateReview(tenantId: string, id: string, dto: UpdatePerformanceReviewDto): Promise<PerformanceReview> {
    const review = await this.findReview(tenantId, id);
    Object.assign(review, dto);
    return this.performanceReviewRepo.save(review);
  }

  async removeReview(tenantId: string, id: string): Promise<void> {
    const review = await this.findReview(tenantId, id);
    await this.performanceReviewRepo.softRemove(review);
  }

  // ─── Review Participants ────────────────────────────────────────────────────

  async addParticipant(tenantId: string, dto: CreateReviewParticipantDto): Promise<ReviewParticipant> {
    const existing = await this.reviewParticipantRepo.findOne({
      where: { review_id: dto.review_id, participant_id: dto.participant_id },
    });
    if (existing) throw new ConflictException('Participant already added to this review');
    const p = this.reviewParticipantRepo.create({ ...dto, tenant_id: tenantId });
    return this.reviewParticipantRepo.save(p);
  }

  async findParticipantsByReview(reviewId: string): Promise<ReviewParticipant[]> {
    return this.reviewParticipantRepo.find({ where: { review_id: reviewId } });
  }

  async updateParticipant(id: string, dto: UpdateReviewParticipantDto): Promise<ReviewParticipant> {
    const p = await this.reviewParticipantRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Review participant not found');
    Object.assign(p, dto);
    return this.reviewParticipantRepo.save(p);
  }

  async removeParticipant(id: string): Promise<void> {
    const p = await this.reviewParticipantRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Review participant not found');
    await this.reviewParticipantRepo.remove(p);
  }

  // ─── Review Responses ───────────────────────────────────────────────────────

  async upsertResponse(tenantId: string, dto: CreateReviewResponseDto): Promise<ReviewResponse> {
    const existing = await this.reviewResponseRepo.findOne({
      where: { review_id: dto.review_id, participant_id: dto.participant_id, question_id: dto.question_id },
    });
    if (existing) {
      Object.assign(existing, dto);
      return this.reviewResponseRepo.save(existing);
    }
    const r = this.reviewResponseRepo.create({ ...dto, tenant_id: tenantId });
    return this.reviewResponseRepo.save(r);
  }

  async findResponsesByReview(reviewId: string): Promise<ReviewResponse[]> {
    return this.reviewResponseRepo.find({ where: { review_id: reviewId } });
  }

  async updateResponse(id: string, dto: UpdateReviewResponseDto): Promise<ReviewResponse> {
    const r = await this.reviewResponseRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Review response not found');
    Object.assign(r, dto);
    return this.reviewResponseRepo.save(r);
  }
}
