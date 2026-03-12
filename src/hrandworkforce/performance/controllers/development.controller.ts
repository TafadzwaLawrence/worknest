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
import { DevelopmentService } from '../services/development.service.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import {
  CreateTrainingRequestDto,
  UpdateTrainingRequestDto,
  CreateDevelopmentPlanDto,
  UpdateDevelopmentPlanDto,
  CreateDevelopmentPlanItemDto,
  UpdateDevelopmentPlanItemDto,
} from '../dto/performance.dto.js';

@Controller('performance/development')
export class DevelopmentController {
  constructor(private readonly developmentService: DevelopmentService) {}

  // ─── Training Requests ────────────────────────────────────────────────────────

  @Post('requests')
  createRequest(
    @CurrentUser() user: { tenant_id: string; id: string; employee_id?: string },
    @Body() dto: CreateTrainingRequestDto,
  ) {
    const employeeId = user.employee_id ?? user.id;
    return this.developmentService.createRequest(user.tenant_id, employeeId, dto);
  }

  @Get('requests')
  findAllRequests(
    @CurrentUser() user: { tenant_id: string },
    @Query('employeeId') employeeId?: string,
  ) {
    return this.developmentService.findAllRequests(user.tenant_id, employeeId);
  }

  @Get('requests/:id')
  findRequest(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.developmentService.findRequest(user.tenant_id, id);
  }

  @Put('requests/:id/review')
  reviewRequest(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrainingRequestDto,
  ) {
    return this.developmentService.reviewRequest(user.tenant_id, id, dto, user.id);
  }

  @Delete('requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRequest(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.developmentService.removeRequest(user.tenant_id, id);
  }

  // ─── Development Plans ────────────────────────────────────────────────────────

  @Post('plans')
  createPlan(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateDevelopmentPlanDto,
  ) {
    return this.developmentService.createPlan(user.tenant_id, dto, user.id);
  }

  @Get('plans')
  findAllPlans(
    @CurrentUser() user: { tenant_id: string },
    @Query('employeeId') employeeId?: string,
  ) {
    return this.developmentService.findAllPlans(user.tenant_id, employeeId);
  }

  @Get('plans/:id')
  findPlan(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.developmentService.findPlan(user.tenant_id, id);
  }

  @Put('plans/:id')
  updatePlan(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDevelopmentPlanDto,
  ) {
    return this.developmentService.updatePlan(user.tenant_id, id, dto);
  }

  @Put('plans/:id/approve')
  approvePlan(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.developmentService.approvePlan(user.tenant_id, id, user.id);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePlan(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.developmentService.removePlan(user.tenant_id, id);
  }

  // ─── Development Plan Items ───────────────────────────────────────────────────

  @Post('plans/:planId/items')
  createItem(
    @CurrentUser() user: { tenant_id: string },
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: CreateDevelopmentPlanItemDto,
  ) {
    return this.developmentService.createItem(user.tenant_id, { ...dto, plan_id: planId });
  }

  @Get('plans/:planId/items')
  findItems(@Param('planId', ParseUUIDPipe) planId: string) {
    return this.developmentService.findItemsByPlan(planId);
  }

  @Put('plans/items/:id')
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDevelopmentPlanItemDto,
  ) {
    return this.developmentService.updateItem(id, dto);
  }

  @Delete('plans/items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.developmentService.removeItem(id);
  }
}
