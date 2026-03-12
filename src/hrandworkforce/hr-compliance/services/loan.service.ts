import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeLoan } from '../entities/employee-loan.entity.js';
import { LoanRepayment } from '../entities/loan-repayment.entity.js';
import {
  CreateLoanDto,
  ApproveLoanDto,
  CreateLoanRepaymentDto,
} from '../dto/hr-compliance.dto.js';
import { LoanStatus } from '../hr-compliance.enums.js';

@Injectable()
export class LoanService {
  constructor(
    @InjectRepository(EmployeeLoan)
    private readonly loanRepo: Repository<EmployeeLoan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepo: Repository<LoanRepayment>,
  ) {}

  async createLoan(
    tenantId: string,
    userId: string,
    dto: CreateLoanDto,
  ): Promise<EmployeeLoan> {
    const loan = this.loanRepo.create({
      ...dto,
      tenant_id: tenantId,
      created_by: userId,
    });
    return this.loanRepo.save(loan);
  }

  async approveLoan(
    tenantId: string,
    id: string,
    dto: ApproveLoanDto,
  ): Promise<EmployeeLoan> {
    const loan = await this.findOneLoan(tenantId, id);
    loan.status = LoanStatus.APPROVED;
    loan.approved_by = dto.approved_by;
    loan.approved_at = new Date();
    if (dto.disbursed_on) {
      loan.disbursed_on = dto.disbursed_on;
      loan.status = LoanStatus.DISBURSED;
    }
    return this.loanRepo.save(loan);
  }

  async findAllLoans(tenantId: string): Promise<EmployeeLoan[]> {
    return this.loanRepo.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async findLoansByEmployee(
    tenantId: string,
    employeeId: string,
  ): Promise<EmployeeLoan[]> {
    return this.loanRepo.find({
      where: { tenant_id: tenantId, employee_id: employeeId },
      order: { created_at: 'DESC' },
    });
  }

  async findOneLoan(tenantId: string, id: string): Promise<EmployeeLoan> {
    const loan = await this.loanRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!loan) throw new NotFoundException(`Loan ${id} not found`);
    return loan;
  }

  async addRepayment(
    tenantId: string,
    loanId: string,
    userId: string,
    dto: CreateLoanRepaymentDto,
  ): Promise<LoanRepayment> {
    await this.findOneLoan(tenantId, loanId);
    const repayment = this.repaymentRepo.create({
      ...dto,
      tenant_id: tenantId,
      loan_id: loanId,
      created_by: userId,
    });
    return this.repaymentRepo.save(repayment);
  }

  async findRepayments(
    tenantId: string,
    loanId: string,
  ): Promise<LoanRepayment[]> {
    await this.findOneLoan(tenantId, loanId);
    return this.repaymentRepo.find({
      where: { tenant_id: tenantId, loan_id: loanId },
      order: { payment_date: 'DESC' },
    });
  }
}
