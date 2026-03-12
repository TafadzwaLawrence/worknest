import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Delete,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../../core/entities/user.entity.js';
import { AttendanceService } from '../services/attendance.service.js';
import {
  CreateAttendanceRuleDto,
  ClockInDto,
  ClockOutDto,
  UpdateAttendanceRecordDto,
  CreateAttendanceCorrectionDto,
  ReviewCorrectionDto,
} from '../dto/time-attendance.dto.js';

@ApiTags('Time & Attendance — Rules')
@Controller('time-attendance/rules')
export class AttendanceRuleController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.attendanceService.findAllRules(user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateAttendanceRuleDto, @CurrentUser() user: User) {
    return this.attendanceService.createRule(dto, user.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateAttendanceRuleDto>,
    @CurrentUser() user: User,
  ) {
    return this.attendanceService.updateRule(id, dto, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.attendanceService.removeRule(id, user.tenant_id);
  }
}

@ApiTags('Time & Attendance — Records')
@Controller('time-attendance/records')
export class AttendanceRecordController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('employee_id') employeeId?: string) {
    return this.attendanceService.findRecords(user.tenant_id, employeeId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.attendanceService.findOneRecord(id, user.tenant_id);
  }

  @Post('clock-in')
  clockIn(@Body() dto: ClockInDto, @CurrentUser() user: User) {
    return this.attendanceService.clockIn(dto, user.tenant_id);
  }

  @Patch(':id/clock-out')
  clockOut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ClockOutDto,
    @CurrentUser() user: User,
  ) {
    return this.attendanceService.clockOut(id, dto, user.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceRecordDto,
    @CurrentUser() user: User,
  ) {
    return this.attendanceService.updateRecord(id, dto, user.tenant_id, user.employee_id);
  }
}

@ApiTags('Time & Attendance — Corrections')
@Controller('time-attendance/corrections')
export class AttendanceCorrectionController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('employee_id') employeeId?: string) {
    return this.attendanceService.findCorrections(user.tenant_id, employeeId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.attendanceService.findOneCorrection(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateAttendanceCorrectionDto, @CurrentUser() user: User) {
    return this.attendanceService.createCorrection(dto, user.employee_id, user.tenant_id);
  }

  @Patch(':id/review')
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewCorrectionDto,
    @CurrentUser() user: User,
  ) {
    return this.attendanceService.reviewCorrection(id, dto, user.employee_id, user.tenant_id);
  }
}
