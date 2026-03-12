import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingRequest } from '../entities/training-request.entity.js';
import { DevelopmentPlan } from '../entities/development-plan.entity.js';
import { DevelopmentPlanItem } from '../entities/development-plan-item.entity.js';
import {
  CreateTrainingRequestDto,
  UpdateTrainingRequestDto,
  CreateDevelopmentPlanDto,
  UpdateDevelopmentPlanDto,
  CreateDevelopmentPlanItemDto,
  UpdateDevelopmentPlanItemDto,
} from '../dto/performance.dto.js';

@Injectable()
export class DevelopmentService {
  constructor(
    @InjectRepository(TrainingRequest)
    private readonly trainingRequestRepo: Repository<TrainingRequest>,
    @InjectRepository(DevelopmentPlan)
    private readonly developmentPlanRepo: Repository<DevelopmentPlan>,
    @InjectRepository(DevelopmentPlanItem)
    private readonly planItemRepo: Repository<DevelopmentPlanItem>,
  ) {}

  // ─── Training Requests ────────────────────────────────────────────────────────

  async createRequest(tenantId: string, employeeId: string, dto: CreateTrainingRequestDto): Promise<TrainingRequest> {
    const req = this.trainingRequestRepo.create({ ...dto, tenant_id: tenantId, employee_id: employeeId, created_by: employeeId });
    return this.trainingRequestRepo.save(req);
  }

  async findAllRequests(tenantId: string, employeeId?: string): Promise<TrainingRequest[]> {
    const where: Record<string, unknown> = { tenant_id: tenantId };
    if (employeeId) where.employee_id = employeeId;
    return this.trainingRequestRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async findRequest(tenantId: string, id: string): Promise<TrainingRequest> {
    const req = await this.trainingRequestRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!req) throw new NotFoundException('Training request not found');
    return req;
  }

  async reviewRequest(tenantId: string, id: string, dto: UpdateTrainingRequestDto, reviewerId: string): Promise<TrainingRequest> {
    const req = await this.findRequest(tenantId, id);
    Object.assign(req, dto, { reviewed_by: reviewerId, reviewed_at: new Date() });
    return this.trainingRequestRepo.save(req);
  }

  async removeRequest(tenantId: string, id: string): Promise<void> {
    const req = await this.findRequest(tenantId, id);
    await this.trainingRequestRepo.remove(req);
  }

  // ─── Development Plans ────────────────────────────────────────────────────────

  async createPlan(tenantId: string, dto: CreateDevelopmentPlanDto, userId: string): Promise<DevelopmentPlan> {
    const plan = this.developmentPlanRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.developmentPlanRepo.save(plan);
  }

  async findAllPlans(tenantId: string, employeeId?: string): Promise<DevelopmentPlan[]> {
    const where: Record<string, unknown> = { tenant_id: tenantId };
    if (employeeId) where.employee_id = employeeId;
    return this.developmentPlanRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async findPlan(tenantId: string, id: string): Promise<DevelopmentPlan> {
    const plan = await this.developmentPlanRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!plan) throw new NotFoundException('Development plan not found');
    return plan;
  }

  async updatePlan(tenantId: string, id: string, dto: UpdateDevelopmentPlanDto): Promise<DevelopmentPlan> {
    const plan = await this.findPlan(tenantId, id);
    Object.assign(plan, dto);
    return this.developmentPlanRepo.save(plan);
  }

  async approvePlan(tenantId: string, id: string, approverId: string): Promise<DevelopmentPlan> {
    const plan = await this.findPlan(tenantId, id);
    plan.status = 'active';
    plan.approved_by = approverId;
    plan.approved_at = new Date();
    return this.developmentPlanRepo.save(plan);
  }

  async removePlan(tenantId: string, id: string): Promise<void> {
    const plan = await this.findPlan(tenantId, id);
    await this.developmentPlanRepo.softRemove(plan);
  }

  // ─── Development Plan Items ───────────────────────────────────────────────────

  async createItem(tenantId: string, dto: CreateDevelopmentPlanItemDto): Promise<DevelopmentPlanItem> {
    const item = this.planItemRepo.create({ ...dto, tenant_id: tenantId });
    return this.planItemRepo.save(item);
  }

  async findItemsByPlan(planId: string): Promise<DevelopmentPlanItem[]> {
    return this.planItemRepo.find({ where: { plan_id: planId }, order: { order_index: 'ASC' } });
  }

  async findItem(id: string): Promise<DevelopmentPlanItem> {
    const item = await this.planItemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Development plan item not found');
    return item;
  }

  async updateItem(id: string, dto: UpdateDevelopmentPlanItemDto): Promise<DevelopmentPlanItem> {
    const item = await this.findItem(id);
    Object.assign(item, dto);
    return this.planItemRepo.save(item);
  }

  async removeItem(id: string): Promise<void> {
    const item = await this.findItem(id);
    await this.planItemRepo.remove(item);
  }
}
