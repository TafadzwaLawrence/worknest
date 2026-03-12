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
import { TimeEntryService } from '../services/time-entry.service.js';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from '../dto/payroll.dto.js';

@ApiTags('Payroll — Time Entries')
@Controller('payroll/time-entries')
export class TimeEntryController {
  constructor(private readonly timeEntryService: TimeEntryService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('employee_id') employeeId?: string,
    @Query('entry_date') entryDate?: string,
  ) {
    return this.timeEntryService.findAll(user.tenant_id, employeeId, entryDate);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.timeEntryService.findOne(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateTimeEntryDto, @CurrentUser() user: User) {
    return this.timeEntryService.create(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTimeEntryDto,
    @CurrentUser() user: User,
  ) {
    return this.timeEntryService.update(id, dto, user.tenant_id);
  }

  @Patch(':id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.timeEntryService.approve(id, user.id, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.timeEntryService.remove(id, user.tenant_id);
  }
}
