import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../entities/workflow.entity.js';
import { WorkflowInstance } from '../entities/workflow-instance.entity.js';
import { WorkflowStep } from '../entities/workflow-step.entity.js';
import { InstanceStep } from '../entities/instance-step.entity.js';
import { StepAction } from '../entities/step-action.entity.js';
import { StepDelegation } from '../entities/step-delegation.entity.js';
import { CreateWorkflowInstanceDto } from '../dto/create-workflow-instance.dto.js';
import { ActionStepDto } from '../dto/action-step.dto.js';
import { DelegateStepDto } from '../dto/delegate-step.dto.js';
import { CancelInstanceDto } from '../dto/cancel-instance.dto.js';
import { PaginationDto } from '../../core/dto/pagination.dto.js';
import {
  ApprovalAction,
  InstanceStatus,
  WorkflowStatus,
} from '../entities/workflow.enums.js';

@Injectable()
export class WorkflowInstanceService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepo: Repository<Workflow>,
    @InjectRepository(WorkflowInstance)
    private readonly instanceRepo: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStep)
    private readonly stepRepo: Repository<WorkflowStep>,
    @InjectRepository(InstanceStep)
    private readonly instanceStepRepo: Repository<InstanceStep>,
    @InjectRepository(StepAction)
    private readonly actionRepo: Repository<StepAction>,
    @InjectRepository(StepDelegation)
    private readonly delegationRepo: Repository<StepDelegation>,
  ) {}

  async findAll(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.instanceRepo.findAndCount({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<WorkflowInstance> {
    const instance = await this.instanceRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!instance) throw new NotFoundException(`Workflow instance ${id} not found`);
    return instance;
  }

  async getMyTasks(userId: string, tenantId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const [data, total] = await this.instanceStepRepo.findAndCount({
      where: {
        assigned_to: userId,
        tenant_id: tenantId,
        status: InstanceStatus.PENDING,
      },
      relations: ['instance', 'step'],
      order: { due_date: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async startInstance(dto: CreateWorkflowInstanceDto, tenantId: string, initiatorId: string): Promise<WorkflowInstance> {
    const workflow = await this.workflowRepo.findOne({
      where: { id: dto.workflow_id, tenant_id: tenantId },
    });
    if (!workflow) throw new NotFoundException(`Workflow ${dto.workflow_id} not found`);
    if (workflow.status !== WorkflowStatus.ACTIVE) {
      throw new BadRequestException('Only active workflows can be started');
    }

    // Load first step ordered by position
    const firstStep = await this.stepRepo.findOne({
      where: { workflow_id: dto.workflow_id, tenant_id: tenantId },
      order: { position: 'ASC' },
    });

    const instance = this.instanceRepo.create({
      ...dto,
      tenant_id: tenantId,
      initiator_id: initiatorId,
      status: InstanceStatus.IN_PROGRESS,
      current_step_id: firstStep?.id ?? null,
      due_date: dto.due_date ? new Date(dto.due_date) : undefined,
    });
    const saved = await this.instanceRepo.save(instance);

    // Create the first instance_step record if a step exists
    if (firstStep) {
      const instanceStep = this.instanceStepRepo.create({
        tenant_id: tenantId,
        instance_id: saved.id,
        step_id: firstStep.id,
        status: InstanceStatus.PENDING,
        assigned_at: new Date(),
        due_date: firstStep.timeout_hours
          ? new Date(Date.now() + firstStep.timeout_hours * 3_600_000)
          : undefined,
      });
      await this.instanceStepRepo.save(instanceStep);
    }

    return saved;
  }

  async actionStep(
    instanceId: string,
    stepId: string,
    dto: ActionStepDto,
    tenantId: string,
    userId: string,
  ): Promise<InstanceStep> {
    const instanceStep = await this.instanceStepRepo.findOne({
      where: { id: stepId, instance_id: instanceId, tenant_id: tenantId },
    });
    if (!instanceStep) throw new NotFoundException('Instance step not found');
    if (instanceStep.status !== InstanceStatus.PENDING) {
      throw new BadRequestException('This step is not pending');
    }
    if (instanceStep.assigned_to && instanceStep.assigned_to !== userId) {
      throw new BadRequestException('You are not assigned to this step');
    }

    const now = new Date();
    const startTime = instanceStep.assigned_at ?? instanceStep.created_at ?? new Date();
    instanceStep.action_taken = dto.action;
    instanceStep.comments = dto.comments ?? null;
    instanceStep.completed_at = now;
    instanceStep.time_taken_seconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    // Determine final step status
    if (dto.action === ApprovalAction.APPROVE) {
      instanceStep.status = InstanceStatus.APPROVED;
    } else if (dto.action === ApprovalAction.REJECT) {
      instanceStep.status = InstanceStatus.REJECTED;
    } else if (dto.action === ApprovalAction.ESCALATE) {
      instanceStep.status = InstanceStatus.ESCALATED;
    } else {
      instanceStep.status = InstanceStatus.COMPLETED;
    }

    await this.instanceStepRepo.save(instanceStep);

    // Record the action in audit history
    await this.actionRepo.save(
      this.actionRepo.create({
        tenant_id: tenantId,
        instance_step_id: instanceStep.id,
        action_by: userId,
        action_taken: dto.action,
        comments: dto.comments,
      }),
    );

    // Advance the workflow instance after approval/completion
    if (
      instanceStep.status === InstanceStatus.APPROVED ||
      instanceStep.status === InstanceStatus.COMPLETED
    ) {
      await this.advanceInstance(instanceId, instanceStep.step_id, tenantId);
    } else if (instanceStep.status === InstanceStatus.REJECTED) {
      await this.instanceRepo.update(
        { id: instanceId },
        { status: InstanceStatus.REJECTED },
      );
    }

    return instanceStep;
  }

  private async advanceInstance(instanceId: string, currentStepId: string, tenantId: string): Promise<void> {
    const current = await this.stepRepo.findOne({ where: { id: currentStepId } });
    if (!current) return;

    const nextStep = await this.stepRepo.findOne({
      where: { workflow_id: current.workflow_id, tenant_id: tenantId },
      order: { position: 'ASC' },
    });

    const isNextStep = nextStep && nextStep.position > current.position;
    if (isNextStep) {
      // Create next instance step
      const nextInstanceStep = this.instanceStepRepo.create({
        tenant_id: tenantId,
        instance_id: instanceId,
        step_id: nextStep.id,
        status: InstanceStatus.PENDING,
        assigned_at: new Date(),
        due_date: nextStep.timeout_hours
          ? new Date(Date.now() + nextStep.timeout_hours * 3_600_000)
          : undefined,
      });
      await this.instanceStepRepo.save(nextInstanceStep);
      await this.instanceRepo.update({ id: instanceId }, { current_step_id: nextStep.id });
    } else {
      // No more steps — complete the instance
      await this.instanceRepo.update(
        { id: instanceId },
        { status: InstanceStatus.COMPLETED, completed_at: new Date(), current_step_id: null },
      );
    }
  }

  async delegateStep(
    instanceId: string,
    stepId: string,
    dto: DelegateStepDto,
    tenantId: string,
    userId: string,
  ): Promise<StepDelegation> {
    const instanceStep = await this.instanceStepRepo.findOne({
      where: { id: stepId, instance_id: instanceId, tenant_id: tenantId },
    });
    if (!instanceStep) throw new NotFoundException('Instance step not found');

    const delegation = this.delegationRepo.create({
      tenant_id: tenantId,
      instance_step_id: instanceStep.id,
      original_assignee: userId,
      delegated_to: dto.delegated_to,
      reason: dto.reason,
      start_date: new Date(dto.start_date),
      end_date: dto.end_date ? new Date(dto.end_date) : undefined,
    });

    // Reassign the step
    instanceStep.assigned_to = dto.delegated_to;
    await this.instanceStepRepo.save(instanceStep);

    return this.delegationRepo.save(delegation);
  }

  async cancelInstance(id: string, dto: CancelInstanceDto, tenantId: string): Promise<WorkflowInstance> {
    const instance = await this.findOne(id, tenantId);
    if (
      instance.status === InstanceStatus.COMPLETED ||
      instance.status === InstanceStatus.CANCELLED
    ) {
      throw new BadRequestException('Instance is already completed or cancelled');
    }
    instance.status = InstanceStatus.CANCELLED;
    instance.cancellation_reason = dto.reason ?? null;
    return this.instanceRepo.save(instance);
  }

  async getInstanceSteps(instanceId: string, tenantId: string): Promise<InstanceStep[]> {
    return this.instanceStepRepo.find({
      where: { instance_id: instanceId, tenant_id: tenantId },
      relations: ['step'],
      order: { created_at: 'ASC' },
    });
  }
}
