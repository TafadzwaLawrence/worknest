import {
  Body,
  Controller,
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
import { TimesheetService } from '../services/timesheet.service.js';
import {
  CreateTimesheetDto,
  UpdateTimesheetStatusDto,
  CreateOvertimeRequestDto,
  ReviewOvertimeDto,
} from '../dto/time-attendance.dto.js';

@ApiTags('Time & Attendance — Timesheets')
@Controller('time-attendance/timesheets')
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('employee_id') employeeId?: string) {
    return this.timesheetService.findAll(user.tenant_id, employeeId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.timesheetService.findOne(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateTimesheetDto, @CurrentUser() user: User) {
    return this.timesheetService.create(dto, user.tenant_id);
  }

  @Patch(':id/submit')
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.timesheetService.submit(id, user.tenant_id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTimesheetStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.timesheetService.updateStatus(id, dto, user.employee_id, user.tenant_id);
  }
}

@ApiTags('Time & Attendance — Overtime')
@Controller('time-attendance/overtime-requests')
export class OvertimeRequestController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('employee_id') employeeId?: string) {
    return this.timesheetService.findOvertimeRequests(user.tenant_id, employeeId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.timesheetService.findOneOvertime(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateOvertimeRequestDto, @CurrentUser() user: User) {
    return this.timesheetService.createOvertime(dto, user.employee_id, user.tenant_id);
  }

  @Patch(':id/review')
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewOvertimeDto,
    @CurrentUser() user: User,
  ) {
    return this.timesheetService.reviewOvertime(id, dto, user.employee_id, user.tenant_id);
  }
}
