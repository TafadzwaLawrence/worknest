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
import { PayrollService } from '../services/payroll.service.js';
import {
  CreatePayPeriodDto,
  UpdatePayPeriodDto,
  CreatePayrollRunDto,
  UpdatePayrollRunStatusDto,
  CreatePayrollRecordDto,
  UpdatePayrollRecordDto,
  CreatePayrollEarningDto,
  CreatePayrollDeductionDto,
  CreatePayrollTaxDto,
} from '../dto/payroll.dto.js';

@ApiTags('Payroll — Pay Periods')
@Controller('payroll/pay-periods')
export class PayPeriodController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.payrollService.findAllPeriods(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.payrollService.findOnePeriod(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreatePayPeriodDto, @CurrentUser() user: User) {
    return this.payrollService.createPeriod(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayPeriodDto,
    @CurrentUser() user: User,
  ) {
    return this.payrollService.updatePeriod(id, dto, user.tenant_id);
  }
}

@ApiTags('Payroll — Payroll Runs')
@Controller('payroll/runs')
export class PayrollRunController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('pay_period_id') periodId?: string) {
    return this.payrollService.findRuns(user.tenant_id, periodId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.payrollService.findOneRun(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreatePayrollRunDto, @CurrentUser() user: User) {
    return this.payrollService.createRun(dto, user.tenant_id, user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayrollRunStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.payrollService.updateRunStatus(id, dto, user.id, user.tenant_id);
  }

  // ─── Records within a run ─────────────────────────────────────────────────────

  @Get(':runId/records')
  findRecords(@Param('runId', ParseUUIDPipe) runId: string, @CurrentUser() user: User) {
    return this.payrollService.findRecords(runId, user.tenant_id);
  }

  @Post(':runId/records')
  createRecord(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Body() dto: CreatePayrollRecordDto,
    @CurrentUser() user: User,
  ) {
    return this.payrollService.createRecord(runId, dto, user.tenant_id);
  }
}

@ApiTags('Payroll — Payroll Records')
@Controller('payroll/records')
export class PayrollRecordController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.payrollService.findOneRecord(id, user.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayrollRecordDto,
    @CurrentUser() user: User,
  ) {
    return this.payrollService.updateRecord(id, dto, user.tenant_id);
  }

  // ─── Earnings ─────────────────────────────────────────────────────────────────

  @Get(':recordId/earnings')
  findEarnings(@Param('recordId', ParseUUIDPipe) recordId: string, @CurrentUser() user: User) {
    return this.payrollService.findEarnings(recordId, user.tenant_id);
  }

  @Post(':recordId/earnings')
  addEarning(
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @Body() dto: CreatePayrollEarningDto,
    @CurrentUser() user: User,
  ) {
    return this.payrollService.addEarning(recordId, dto, user.tenant_id);
  }

  @Delete(':recordId/earnings/:earningId')
  removeEarning(
    @Param('earningId', ParseUUIDPipe) earningId: string,
    @CurrentUser() user: User,
  ) {
    return this.payrollService.removeEarning(earningId, user.tenant_id);
  }

  // ─── Deductions ───────────────────────────────────────────────────────────────

  @Get(':recordId/deductions')
  findDeductions(@Param('recordId', ParseUUIDPipe) recordId: string, @CurrentUser() user: User) {
    return this.payrollService.findDeductions(recordId, user.tenant_id);
  }

  @Post(':recordId/deductions')
  addDeduction(
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @Body() dto: CreatePayrollDeductionDto,
    @CurrentUser() user: User,
  ) {
    return this.payrollService.addDeduction(recordId, dto, user.tenant_id);
  }

  @Delete(':recordId/deductions/:deductionId')
  removeDeduction(
    @Param('deductionId', ParseUUIDPipe) deductionId: string,
    @CurrentUser() user: User,
  ) {
    return this.payrollService.removeDeduction(deductionId, user.tenant_id);
  }

  // ─── Taxes ────────────────────────────────────────────────────────────────────

  @Get(':recordId/taxes')
  findTaxes(@Param('recordId', ParseUUIDPipe) recordId: string, @CurrentUser() user: User) {
    return this.payrollService.findTaxes(recordId, user.tenant_id);
  }

  @Post(':recordId/taxes')
  addTax(
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @Body() dto: CreatePayrollTaxDto,
    @CurrentUser() user: User,
  ) {
    return this.payrollService.addTax(recordId, dto, user.tenant_id);
  }
}
