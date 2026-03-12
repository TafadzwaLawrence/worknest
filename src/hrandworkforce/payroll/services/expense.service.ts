import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseReport } from '../entities/expense-report.entity.js';
import {
  CreateExpenseReportDto,
  UpdateExpenseReportDto,
  ReviewExpenseReportDto,
} from '../dto/payroll.dto.js';
import { ExpenseStatus } from '../payroll.enums.js';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(ExpenseReport)
    private readonly expenseRepo: Repository<ExpenseReport>,
  ) {}

  findAll(tenantId: string, employeeId?: string) {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (employeeId) where['employee_id'] = employeeId;
    return this.expenseRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async findOne(id: string, tenantId: string) {
    const e = await this.expenseRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!e) throw new NotFoundException('Expense report not found');
    return e;
  }

  create(dto: CreateExpenseReportDto, employeeId: string, tenantId: string, createdBy: string) {
    return this.expenseRepo.save(
      this.expenseRepo.create({
        ...dto,
        employee_id: employeeId,
        tenant_id: tenantId,
        created_by: createdBy,
      }),
    );
  }

  async update(id: string, dto: UpdateExpenseReportDto, tenantId: string, updatedBy: string) {
    const e = await this.findOne(id, tenantId);
    Object.assign(e, dto);
    e.updated_by = updatedBy;
    return this.expenseRepo.save(e);
  }

  async submit(id: string, tenantId: string) {
    const e = await this.findOne(id, tenantId);
    e.status = ExpenseStatus.SUBMITTED;
    e.submitted_at = new Date();
    return this.expenseRepo.save(e);
  }

  async review(id: string, dto: ReviewExpenseReportDto, approverId: string, tenantId: string) {
    const e = await this.findOne(id, tenantId);
    e.status = dto.status;
    if (dto.status === ExpenseStatus.APPROVED) {
      e.approved_by = approverId;
      e.approved_at = new Date();
    } else if (dto.status === ExpenseStatus.REJECTED && dto.rejection_reason) {
      e.rejection_reason = dto.rejection_reason;
    } else if (dto.status === ExpenseStatus.PAID) {
      e.paid_at = new Date();
    }
    return this.expenseRepo.save(e);
  }

  async remove(id: string, tenantId: string) {
    const e = await this.findOne(id, tenantId);
    return this.expenseRepo.softRemove(e);
  }
}
