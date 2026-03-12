import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GoalService } from '../services/goal.service.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import {
  CreateGoalTemplateDto,
  UpdateGoalTemplateDto,
  CreateGoalDto,
  UpdateGoalDto,
  CreateGoalAlignmentDto,
  CreateGoalUpdateDto,
} from '../dto/performance.dto.js';

@Controller('performance/goals')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  // ─── Goal Templates ─────────────────────────────────────────────────────────

  @Post('templates')
  createTemplate(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateGoalTemplateDto,
  ) {
    return this.goalService.createTemplate(user.tenant_id, dto, user.id);
  }

  @Get('templates')
  findAllTemplates(@CurrentUser() user: { tenant_id: string }) {
    return this.goalService.findAllTemplates(user.tenant_id);
  }

  @Get('templates/:id')
  findTemplate(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goalService.findTemplate(user.tenant_id, id);
  }

  @Put('templates/:id')
  updateTemplate(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalTemplateDto,
  ) {
    return this.goalService.updateTemplate(user.tenant_id, id, dto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTemplate(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goalService.removeTemplate(user.tenant_id, id);
  }

  // ─── Goals ──────────────────────────────────────────────────────────────────

  @Post()
  createGoal(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateGoalDto,
  ) {
    return this.goalService.createGoal(user.tenant_id, dto, user.id);
  }

  @Get()
  findAllGoals(
    @CurrentUser() user: { tenant_id: string },
    @Query('employeeId') employeeId?: string,
  ) {
    return this.goalService.findAllGoals(user.tenant_id, employeeId);
  }

  @Get(':id')
  findGoal(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goalService.findGoal(user.tenant_id, id);
  }

  @Put(':id')
  updateGoal(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalService.updateGoal(user.tenant_id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeGoal(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goalService.removeGoal(user.tenant_id, id);
  }

  // ─── Goal Alignments ────────────────────────────────────────────────────────

  @Post(':id/alignments')
  createAlignment(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('id', ParseUUIDPipe) goalId: string,
    @Body() dto: CreateGoalAlignmentDto,
  ) {
    return this.goalService.createAlignment(user.tenant_id, { ...dto, goal_id: goalId }, user.id);
  }

  @Get(':id/alignments')
  findAlignments(@Param('id', ParseUUIDPipe) goalId: string) {
    return this.goalService.findAlignmentsByGoal(goalId);
  }

  @Delete('alignments/:alignmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAlignment(@Param('alignmentId', ParseUUIDPipe) id: string) {
    return this.goalService.removeAlignment(id);
  }

  // ─── Goal Updates ────────────────────────────────────────────────────────────

  @Post(':id/updates')
  addUpdate(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('id', ParseUUIDPipe) goalId: string,
    @Body() dto: CreateGoalUpdateDto,
  ) {
    return this.goalService.addUpdate(user.tenant_id, { ...dto, goal_id: goalId }, user.id);
  }

  @Get(':id/updates')
  findUpdates(@Param('id', ParseUUIDPipe) goalId: string) {
    return this.goalService.findUpdatesByGoal(goalId);
  }
}
