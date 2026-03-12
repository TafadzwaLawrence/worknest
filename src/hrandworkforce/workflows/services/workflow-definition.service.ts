import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../entities/workflow.entity.js';
import { WorkflowStep } from '../entities/workflow-step.entity.js';
import { StepAssignment } from '../entities/step-assignment.entity.js';
import { EscalationRule } from '../entities/escalation-rule.entity.js';
import { CreateWorkflowDto } from '../dto/create-workflow.dto.js';
import { UpdateWorkflowDto } from '../dto/update-workflow.dto.js';
import { CreateWorkflowStepDto } from '../dto/create-workflow-step.dto.js';
import { UpdateWorkflowStepDto } from '../dto/update-workflow-step.dto.js';
import { PaginationDto } from '../../core/dto/pagination.dto.js';
import { WorkflowStatus } from '../entities/workflow.enums.js';

@Injectable()
export class WorkflowDefinitionService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepo: Repository<Workflow>,
    @InjectRepository(WorkflowStep)
    private readonly stepRepo: Repository<WorkflowStep>,
    @InjectRepository(StepAssignment)
    private readonly assignmentRepo: Repository<StepAssignment>,
    @InjectRepository(EscalationRule)
    private readonly escalationRepo: Repository<EscalationRule>,
  ) {}

  // ── Workflows ────────────────────────────────────────────────────────────────

  async findAll(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.workflowRepo.findAndCount({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Workflow> {
    const workflow = await this.workflowRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!workflow) throw new NotFoundException(`Workflow ${id} not found`);
    return workflow;
  }

  async create(dto: CreateWorkflowDto, tenantId: string, userId: string): Promise<Workflow> {
    const existing = await this.workflowRepo.findOne({
      where: { name: dto.name, tenant_id: tenantId, version: 1 },
    });
    if (existing) throw new ConflictException(`A workflow named '${dto.name}' already exists`);
    const workflow = this.workflowRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.workflowRepo.save(workflow);
  }

  async update(id: string, dto: UpdateWorkflowDto, tenantId: string, userId: string): Promise<Workflow> {
    const workflow = await this.findOne(id, tenantId);
    Object.assign(workflow, { ...dto, updated_by: userId });
    return this.workflowRepo.save(workflow);
  }

  async activate(id: string, tenantId: string, userId: string): Promise<Workflow> {
    const workflow = await this.findOne(id, tenantId);
    const stepCount = await this.stepRepo.count({ where: { workflow_id: id, tenant_id: tenantId } });
    if (stepCount === 0) {
      throw new BadRequestException('Cannot activate a workflow with no steps');
    }
    workflow.status = WorkflowStatus.ACTIVE;
    workflow.updated_by = userId;
    return this.workflowRepo.save(workflow);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const workflow = await this.findOne(id, tenantId);
    if (workflow.status === WorkflowStatus.ACTIVE) {
      throw new ConflictException('Cannot delete an active workflow. Archive it first.');
    }
    await this.workflowRepo.softRemove(workflow);
  }

  // ── Steps ────────────────────────────────────────────────────────────────────

  async findSteps(workflowId: string, tenantId: string): Promise<WorkflowStep[]> {
    await this.findOne(workflowId, tenantId);
    return this.stepRepo.find({
      where: { workflow_id: workflowId, tenant_id: tenantId },
      order: { position: 'ASC' },
    });
  }

  async findStep(stepId: string, workflowId: string, tenantId: string): Promise<WorkflowStep> {
    const step = await this.stepRepo.findOne({
      where: { id: stepId, workflow_id: workflowId, tenant_id: tenantId },
    });
    if (!step) throw new NotFoundException(`Step ${stepId} not found`);
    return step;
  }

  async createStep(workflowId: string, dto: CreateWorkflowStepDto, tenantId: string, userId: string): Promise<WorkflowStep> {
    const workflow = await this.findOne(workflowId, tenantId);
    if (workflow.status === WorkflowStatus.ACTIVE) {
      throw new BadRequestException('Cannot add steps to an active workflow. Set it to draft first.');
    }
    const step = this.stepRepo.create({
      ...dto,
      workflow_id: workflowId,
      tenant_id: tenantId,
      created_by: userId,
    });
    return this.stepRepo.save(step);
  }

  async updateStep(stepId: string, workflowId: string, dto: UpdateWorkflowStepDto, tenantId: string): Promise<WorkflowStep> {
    const step = await this.findStep(stepId, workflowId, tenantId);
    Object.assign(step, dto);
    return this.stepRepo.save(step);
  }

  async removeStep(stepId: string, workflowId: string, tenantId: string): Promise<void> {
    const step = await this.findStep(stepId, workflowId, tenantId);
    await this.stepRepo.softRemove(step);
  }

  // ── Step Assignments ──────────────────────────────────────────────────────────

  async findAssignments(stepId: string, tenantId: string): Promise<StepAssignment[]> {
    return this.assignmentRepo.find({
      where: { step_id: stepId, tenant_id: tenantId },
      order: { priority: 'ASC' },
    });
  }

  async createAssignment(stepId: string, dto: Partial<StepAssignment>, tenantId: string, userId: string): Promise<StepAssignment> {
    const assignment = this.assignmentRepo.create({
      ...dto,
      step_id: stepId,
      tenant_id: tenantId,
      created_by: userId,
    });
    return this.assignmentRepo.save(assignment);
  }

  async removeAssignment(assignmentId: string, tenantId: string): Promise<void> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId, tenant_id: tenantId },
    });
    if (!assignment) throw new NotFoundException(`Assignment ${assignmentId} not found`);
    await this.assignmentRepo.softRemove(assignment);
  }

  // ── Escalation Rules ──────────────────────────────────────────────────────────

  async findEscalationRules(stepId: string, tenantId: string): Promise<EscalationRule[]> {
    return this.escalationRepo.find({ where: { step_id: stepId, tenant_id: tenantId } });
  }

  async createEscalationRule(stepId: string, dto: Partial<EscalationRule>, tenantId: string, userId: string): Promise<EscalationRule> {
    const rule = this.escalationRepo.create({
      ...dto,
      step_id: stepId,
      tenant_id: tenantId,
      created_by: userId,
    });
    return this.escalationRepo.save(rule);
  }

  async removeEscalationRule(ruleId: string, tenantId: string): Promise<void> {
    const rule = await this.escalationRepo.findOne({ where: { id: ruleId, tenant_id: tenantId } });
    if (!rule) throw new NotFoundException(`Escalation rule ${ruleId} not found`);
    await this.escalationRepo.softRemove(rule);
  }
}
