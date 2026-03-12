import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoalTemplate } from '../entities/goal-template.entity.js';
import { Goal } from '../entities/goal.entity.js';
import { GoalAlignment } from '../entities/goal-alignment.entity.js';
import { GoalUpdate } from '../entities/goal-update.entity.js';
import {
  CreateGoalTemplateDto,
  UpdateGoalTemplateDto,
  CreateGoalDto,
  UpdateGoalDto,
  CreateGoalAlignmentDto,
  CreateGoalUpdateDto,
} from '../dto/performance.dto.js';

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(GoalTemplate)
    private readonly goalTemplateRepo: Repository<GoalTemplate>,
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
    @InjectRepository(GoalAlignment)
    private readonly goalAlignmentRepo: Repository<GoalAlignment>,
    @InjectRepository(GoalUpdate)
    private readonly goalUpdateRepo: Repository<GoalUpdate>,
  ) {}

  // ─── Goal Templates ─────────────────────────────────────────────────────────

  async createTemplate(tenantId: string, dto: CreateGoalTemplateDto, userId: string): Promise<GoalTemplate> {
    const tpl = this.goalTemplateRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.goalTemplateRepo.save(tpl);
  }

  async findAllTemplates(tenantId: string): Promise<GoalTemplate[]> {
    return this.goalTemplateRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findTemplate(tenantId: string, id: string): Promise<GoalTemplate> {
    const tpl = await this.goalTemplateRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!tpl) throw new NotFoundException('Goal template not found');
    return tpl;
  }

  async updateTemplate(tenantId: string, id: string, dto: UpdateGoalTemplateDto): Promise<GoalTemplate> {
    const tpl = await this.findTemplate(tenantId, id);
    Object.assign(tpl, dto);
    return this.goalTemplateRepo.save(tpl);
  }

  async removeTemplate(tenantId: string, id: string): Promise<void> {
    const tpl = await this.findTemplate(tenantId, id);
    await this.goalTemplateRepo.softRemove(tpl);
  }

  // ─── Goals ──────────────────────────────────────────────────────────────────

  async createGoal(tenantId: string, dto: CreateGoalDto, userId: string): Promise<Goal> {
    const goal = this.goalRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.goalRepo.save(goal);
  }

  async findAllGoals(tenantId: string, employeeId?: string): Promise<Goal[]> {
    const where: Record<string, unknown> = { tenant_id: tenantId };
    if (employeeId) where.employee_id = employeeId;
    return this.goalRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async findGoal(tenantId: string, id: string): Promise<Goal> {
    const goal = await this.goalRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  async updateGoal(tenantId: string, id: string, dto: UpdateGoalDto): Promise<Goal> {
    const goal = await this.findGoal(tenantId, id);
    Object.assign(goal, dto);
    return this.goalRepo.save(goal);
  }

  async removeGoal(tenantId: string, id: string): Promise<void> {
    const goal = await this.findGoal(tenantId, id);
    await this.goalRepo.softRemove(goal);
  }

  // ─── Goal Alignments ────────────────────────────────────────────────────────

  async createAlignment(tenantId: string, dto: CreateGoalAlignmentDto, userId: string): Promise<GoalAlignment> {
    const existing = await this.goalAlignmentRepo.findOne({
      where: { goal_id: dto.goal_id, aligned_goal_id: dto.aligned_goal_id },
    });
    if (existing) throw new ConflictException('Alignment already exists between these goals');
    const alignment = this.goalAlignmentRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.goalAlignmentRepo.save(alignment);
  }

  async findAlignmentsByGoal(goalId: string): Promise<GoalAlignment[]> {
    return this.goalAlignmentRepo.find({ where: { goal_id: goalId } });
  }

  async removeAlignment(id: string): Promise<void> {
    const alignment = await this.goalAlignmentRepo.findOne({ where: { id } });
    if (!alignment) throw new NotFoundException('Goal alignment not found');
    await this.goalAlignmentRepo.remove(alignment);
  }

  // ─── Goal Updates ────────────────────────────────────────────────────────────

  async addUpdate(tenantId: string, dto: CreateGoalUpdateDto, userId: string): Promise<GoalUpdate> {
    const goal = await this.goalRepo.findOne({ where: { id: dto.goal_id, tenant_id: tenantId } });
    if (!goal) throw new NotFoundException('Goal not found');

    const progress_change = goal.current_value != null
      ? Number(dto.new_value) - Number(goal.current_value)
      : undefined;

    const update = this.goalUpdateRepo.create({
      ...dto,
      tenant_id: tenantId,
      updated_by: userId,
      previous_value: goal.current_value,
      progress_change,
    });

    goal.current_value = dto.new_value;
    await this.goalRepo.save(goal);

    return this.goalUpdateRepo.save(update);
  }

  async findUpdatesByGoal(goalId: string): Promise<GoalUpdate[]> {
    return this.goalUpdateRepo.find({ where: { goal_id: goalId }, order: { created_at: 'DESC' } });
  }
}
