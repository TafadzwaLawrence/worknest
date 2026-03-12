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
import { ScheduleService } from '../services/schedule.service.js';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  CreateScheduledShiftDto,
  UpdateShiftStatusDto,
  CreateShiftSwapDto,
  ReviewSwapDto,
  CreateTimeOffRequestDto,
  ReviewTimeOffDto,
} from '../dto/time-attendance.dto.js';

@ApiTags('Time & Attendance — Schedules')
@Controller('time-attendance/schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.scheduleService.findAll(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.scheduleService.findOne(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateScheduleDto, @CurrentUser() user: User) {
    return this.scheduleService.create(dto, user.tenant_id, user.employee_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduleDto,
    @CurrentUser() user: User,
  ) {
    return this.scheduleService.update(id, dto, user.tenant_id);
  }

  @Patch(':id/publish')
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.scheduleService.publish(id, user.employee_id, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.scheduleService.remove(id, user.tenant_id);
  }

  // ─── Scheduled Shifts ──────────────────────────────────────────────────────────

  @Get(':scheduleId/shifts')
  findShifts(@Param('scheduleId', ParseUUIDPipe) scheduleId: string, @CurrentUser() user: User) {
    return this.scheduleService.findShifts(scheduleId, user.tenant_id);
  }

  @Post(':scheduleId/shifts')
  createShift(
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Body() dto: CreateScheduledShiftDto,
    @CurrentUser() user: User,
  ) {
    return this.scheduleService.createShift(scheduleId, dto, user.tenant_id);
  }

  @Patch('shifts/:shiftId/status')
  updateShiftStatus(
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Body() dto: UpdateShiftStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.scheduleService.updateShiftStatus(shiftId, dto, user.tenant_id);
  }

  @Patch('shifts/:shiftId/approve')
  approveShift(@Param('shiftId', ParseUUIDPipe) shiftId: string, @CurrentUser() user: User) {
    return this.scheduleService.approveShift(shiftId, user.employee_id, user.tenant_id);
  }

  @Delete('shifts/:shiftId')
  removeShift(@Param('shiftId', ParseUUIDPipe) shiftId: string, @CurrentUser() user: User) {
    return this.scheduleService.removeShift(shiftId, user.tenant_id);
  }
}

@ApiTags('Time & Attendance — Shift Swaps')
@Controller('time-attendance/shift-swaps')
export class ShiftSwapController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('employee_id') employeeId?: string) {
    return this.scheduleService.findSwaps(user.tenant_id, employeeId);
  }

  @Post()
  create(@Body() dto: CreateShiftSwapDto, @CurrentUser() user: User) {
    return this.scheduleService.createSwap(dto, user.employee_id, user.tenant_id);
  }

  @Patch(':id/review')
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewSwapDto,
    @CurrentUser() user: User,
  ) {
    return this.scheduleService.reviewSwap(id, dto, user.employee_id, user.tenant_id);
  }
}

@ApiTags('Time & Attendance — Time Off Requests')
@Controller('time-attendance/time-off-requests')
export class TimeOffRequestController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('employee_id') employeeId?: string) {
    return this.scheduleService.findTimeOffRequests(user.tenant_id, employeeId);
  }

  @Post()
  create(@Body() dto: CreateTimeOffRequestDto, @CurrentUser() user: User) {
    return this.scheduleService.createTimeOff(dto, user.employee_id, user.tenant_id);
  }

  @Patch(':id/review')
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewTimeOffDto,
    @CurrentUser() user: User,
  ) {
    return this.scheduleService.reviewTimeOff(id, dto, user.employee_id, user.tenant_id);
  }
}
