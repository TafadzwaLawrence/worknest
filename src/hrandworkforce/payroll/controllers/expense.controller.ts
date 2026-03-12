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
import { ExpenseService } from '../services/expense.service.js';
import {
  CreateExpenseReportDto,
  UpdateExpenseReportDto,
  ReviewExpenseReportDto,
} from '../dto/payroll.dto.js';

@ApiTags('Payroll — Expense Reports')
@Controller('payroll/expense-reports')
export class ExpenseReportController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('employee_id') employeeId?: string) {
    return this.expenseService.findAll(user.tenant_id, employeeId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.expenseService.findOne(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateExpenseReportDto, @CurrentUser() user: User) {
    return this.expenseService.create(dto, user.employee_id, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseReportDto,
    @CurrentUser() user: User,
  ) {
    return this.expenseService.update(id, dto, user.tenant_id, user.id);
  }

  @Patch(':id/submit')
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.expenseService.submit(id, user.tenant_id);
  }

  @Patch(':id/review')
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewExpenseReportDto,
    @CurrentUser() user: User,
  ) {
    return this.expenseService.review(id, dto, user.id, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.expenseService.remove(id, user.tenant_id);
  }
}
