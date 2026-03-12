import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../../core/entities/user.entity.js';
import { HolidayService } from '../services/holiday.service.js';
import { CreateHolidayDto, UpdateHolidayDto } from '../dto/time-attendance.dto.js';

@ApiTags('Time & Attendance — Holidays')
@Controller('time-attendance/holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('year', new ParseIntPipe({ optional: true })) year?: number) {
    return this.holidayService.findAll(user.tenant_id, year);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.holidayService.findOne(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateHolidayDto, @CurrentUser() user: User) {
    return this.holidayService.create(dto, user.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHolidayDto,
    @CurrentUser() user: User,
  ) {
    return this.holidayService.update(id, dto, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.holidayService.remove(id, user.tenant_id);
  }
}
