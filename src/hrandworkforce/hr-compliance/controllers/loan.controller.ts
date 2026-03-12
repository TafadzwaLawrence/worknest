import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { LoanService } from '../services/loan.service.js';
import {
  CreateLoanDto,
  ApproveLoanDto,
  CreateLoanRepaymentDto,
} from '../dto/hr-compliance.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('loans')
export class LoanController {
  constructor(private readonly service: LoanService) {}

  @Post()
  create(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateLoanDto,
  ) {
    return this.service.createLoan(user.tenant_id, user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { tenant_id: string }) {
    return this.service.findAllLoans(user.tenant_id);
  }

  @Get('employee/:employeeId')
  findByEmployee(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.service.findLoansByEmployee(user.tenant_id, employeeId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOneLoan(user.tenant_id, id);
  }

  @Patch(':id/approve')
  approve(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveLoanDto,
  ) {
    return this.service.approveLoan(user.tenant_id, id, dto);
  }

  @Post(':id/repayments')
  addRepayment(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('id', ParseUUIDPipe) loanId: string,
    @Body() dto: CreateLoanRepaymentDto,
  ) {
    return this.service.addRepayment(user.tenant_id, loanId, user.id, dto);
  }

  @Get(':id/repayments')
  findRepayments(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) loanId: string,
  ) {
    return this.service.findRepayments(user.tenant_id, loanId);
  }
}
