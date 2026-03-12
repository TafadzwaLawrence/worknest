import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../../core/entities/user.entity.js';
import { WorkflowInstanceService } from '../services/workflow-instance.service.js';
import { CreateWorkflowInstanceDto } from '../dto/create-workflow-instance.dto.js';
import { ActionStepDto } from '../dto/action-step.dto.js';
import { DelegateStepDto } from '../dto/delegate-step.dto.js';
import { CancelInstanceDto } from '../dto/cancel-instance.dto.js';
import { PaginationDto } from '../../core/dto/pagination.dto.js';

@ApiTags('Workflow Instances')
@ApiBearerAuth()
@Controller('workflow-instances')
export class WorkflowInstanceController {
  constructor(private readonly svc: WorkflowInstanceService) {}

  @Get('my-tasks')
  @ApiOperation({ summary: 'Get all pending workflow steps assigned to the current user' })
  myTasks(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.svc.getMyTasks(user.id, user.tenant_id, pagination);
  }

  @Get()
  @ApiOperation({ summary: 'List all workflow instances for the tenant' })
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.svc.findAll(user.tenant_id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workflow instance by ID' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id, user.tenant_id);
  }

  @Get(':id/steps')
  @ApiOperation({ summary: 'Get all step records for an instance' })
  getSteps(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getInstanceSteps(id, user.tenant_id);
  }

  @Post()
  @ApiOperation({ summary: 'Start a new workflow instance' })
  create(@CurrentUser() user: User, @Body() dto: CreateWorkflowInstanceDto) {
    return this.svc.startInstance(dto, user.tenant_id, user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a workflow instance' })
  cancel(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelInstanceDto,
  ) {
    return this.svc.cancelInstance(id, dto, user.tenant_id);
  }

  @Post(':id/steps/:stepId/action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve/reject/escalate/complete a workflow step' })
  actionStep(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: ActionStepDto,
  ) {
    return this.svc.actionStep(id, stepId, dto, user.tenant_id, user.id);
  }

  @Post(':id/steps/:stepId/delegate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delegate a workflow step to another user' })
  delegateStep(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: DelegateStepDto,
  ) {
    return this.svc.delegateStep(id, stepId, dto, user.tenant_id, user.id);
  }
}
