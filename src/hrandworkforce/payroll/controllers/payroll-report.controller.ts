import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../../core/entities/user.entity.js';
import { PayrollReportService } from '../services/payroll-report.service.js';
import {
  CreatePayrollAdjustmentDto,
  CreatePayrollReportDto,
  UpdatePayrollReportDto,
} from '../dto/payroll.dto.js';

@ApiTags('Payroll — Adjustments')
@Controller('payroll/adjustments')
export class PayrollAdjustmentController {
  constructor(private readonly reportService: PayrollReportService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.reportService.findAllAdjustments(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.reportService.findOneAdjustment(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreatePayrollAdjustmentDto, @CurrentUser() user: User) {
    return this.reportService.createAdjustment(dto, user.tenant_id, user.id);
  }
}

@ApiTags('Payroll — Reports')
@Controller('payroll/reports')
export class PayrollReportController {
  constructor(private readonly reportService: PayrollReportService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.reportService.findAllReports(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.reportService.findOneReport(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreatePayrollReportDto, @CurrentUser() user: User) {
    return this.reportService.createReport(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayrollReportDto,
    @CurrentUser() user: User,
  ) {
    return this.reportService.updateReport(id, dto, user.tenant_id);
  }
}
