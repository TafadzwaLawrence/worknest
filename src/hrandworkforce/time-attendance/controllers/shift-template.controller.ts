import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../../core/entities/user.entity.js';
import { AttendanceService } from '../services/attendance.service.js';
import { CreateShiftTemplateDto, UpdateShiftTemplateDto } from '../dto/time-attendance.dto.js';

@ApiTags('Time & Attendance — Shift Templates')
@Controller('time-attendance/shift-templates')
export class ShiftTemplateController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.attendanceService.findAllShiftTemplates(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.attendanceService.findOneShiftTemplate(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateShiftTemplateDto, @CurrentUser() user: User) {
    return this.attendanceService.createShiftTemplate(dto, user.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShiftTemplateDto,
    @CurrentUser() user: User,
  ) {
    return this.attendanceService.updateShiftTemplate(id, dto, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.attendanceService.removeShiftTemplate(id, user.tenant_id);
  }
}
