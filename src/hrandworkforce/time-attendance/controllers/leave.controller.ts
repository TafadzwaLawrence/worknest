import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../../core/entities/user.entity.js';
import { LeaveService } from '../services/leave.service.js';
import {
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  CreateLeavePeriodDto,
  UpdateLeavePeriodDto,
  CreateLeaveEntitlementDto,
  AdjustLeaveEntitlementDto,
  CreateLeaveRequestDto,
  UpdateLeaveRequestStatusDto,
  ApproveLeaveRequestDto,
} from '../dto/time-attendance.dto.js';

@ApiTags('Time & Attendance — Leave Types')
@Controller('time-attendance/leave-types')
export class LeaveTypeController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.leaveService.findAllTypes(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.leaveService.findOneType(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateLeaveTypeDto, @CurrentUser() user: User) {
    return this.leaveService.createType(dto, user.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeaveTypeDto,
    @CurrentUser() user: User,
  ) {
    return this.leaveService.updateType(id, dto, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.leaveService.removeType(id, user.tenant_id);
  }
}

@ApiTags('Time & Attendance — Leave Periods')
@Controller('time-attendance/leave-periods')
export class LeavePeriodController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.leaveService.findAllPeriods(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.leaveService.findOnePeriod(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateLeavePeriodDto, @CurrentUser() user: User) {
    return this.leaveService.createPeriod(dto, user.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeavePeriodDto,
    @CurrentUser() user: User,
  ) {
    return this.leaveService.updatePeriod(id, dto, user.tenant_id);
  }
}

@ApiTags('Time & Attendance — Leave Entitlements')
@Controller('time-attendance/leave-entitlements')
export class LeaveEntitlementController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('employee_id') employeeId?: string) {
    return this.leaveService.findEntitlements(employeeId ?? user.employee_id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateLeaveEntitlementDto, @CurrentUser() user: User) {
    return this.leaveService.createEntitlement(dto, user.tenant_id);
  }

  @Patch(':id/adjust')
  adjust(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustLeaveEntitlementDto,
    @CurrentUser() user: User,
  ) {
    return this.leaveService.adjustEntitlement(id, dto, user.tenant_id);
  }
}

@ApiTags('Time & Attendance — Leave Requests')
@Controller('time-attendance/leave-requests')
export class LeaveRequestController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('employee_id') employeeId?: string) {
    return this.leaveService.findRequests(user.tenant_id, employeeId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.leaveService.findOneRequest(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateLeaveRequestDto, @CurrentUser() user: User) {
    return this.leaveService.createRequest(dto, user.employee_id, user.tenant_id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeaveRequestStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.leaveService.updateRequestStatus(id, dto, user.tenant_id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.leaveService.cancelRequest(id, user.employee_id, user.tenant_id);
  }

  @Get(':id/approvals')
  getApprovals(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.leaveService.findApprovals(id, user.tenant_id);
  }

  @Post(':id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveLeaveRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.leaveService.approveRequest(id, dto, user.employee_id, user.tenant_id);
  }
}
