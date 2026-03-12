import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../../core/entities/user.entity.js';
import { WorkflowDefinitionService } from '../services/workflow-definition.service.js';
import { CreateWorkflowDto } from '../dto/create-workflow.dto.js';
import { UpdateWorkflowDto } from '../dto/update-workflow.dto.js';
import { CreateWorkflowStepDto } from '../dto/create-workflow-step.dto.js';
import { UpdateWorkflowStepDto } from '../dto/update-workflow-step.dto.js';
import { PaginationDto } from '../../core/dto/pagination.dto.js';

@ApiTags('Workflows')
@ApiBearerAuth()
@Controller('workflows')
export class WorkflowController {
  constructor(private readonly svc: WorkflowDefinitionService) {}

  // ── Workflow templates ────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all workflow templates' })
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.svc.findAll(user.tenant_id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workflow template by ID' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id, user.tenant_id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a workflow template' })
  create(@CurrentUser() user: User, @Body() dto: CreateWorkflowDto) {
    return this.svc.create(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a workflow template' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.svc.update(id, dto, user.tenant_id, user.id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a workflow (requires at least one step)' })
  activate(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.activate(id, user.tenant_id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a draft/archived workflow' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id, user.tenant_id);
  }

  // ── Steps (nested under workflow) ────────────────────────────────────────────

  @Get(':id/steps')
  @ApiOperation({ summary: 'List all steps for a workflow' })
  findSteps(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findSteps(id, user.tenant_id);
  }

  @Post(':id/steps')
  @ApiOperation({ summary: 'Add a step to a workflow' })
  createStep(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWorkflowStepDto,
  ) {
    return this.svc.createStep(id, dto, user.tenant_id, user.id);
  }

  @Patch(':id/steps/:stepId')
  @ApiOperation({ summary: 'Update a workflow step' })
  updateStep(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: UpdateWorkflowStepDto,
  ) {
    return this.svc.updateStep(stepId, id, dto, user.tenant_id);
  }

  @Delete(':id/steps/:stepId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a workflow step' })
  removeStep(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
  ) {
    return this.svc.removeStep(stepId, id, user.tenant_id);
  }
}
