import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollAdjustment } from '../entities/payroll-adjustment.entity.js';
import { PayrollReport } from '../entities/payroll-report.entity.js';
import {
  CreatePayrollAdjustmentDto,
  CreatePayrollReportDto,
  UpdatePayrollReportDto,
} from '../dto/payroll.dto.js';

@Injectable()
export class PayrollReportService {
  constructor(
    @InjectRepository(PayrollAdjustment)
    private readonly adjustmentRepo: Repository<PayrollAdjustment>,
    @InjectRepository(PayrollReport)
    private readonly reportRepo: Repository<PayrollReport>,
  ) {}

  // ─── Adjustments ──────────────────────────────────────────────────────────────

  findAllAdjustments(tenantId: string) {
    return this.adjustmentRepo.find({ where: { tenant_id: tenantId }, order: { created_at: 'DESC' } });
  }

  async findOneAdjustment(id: string, tenantId: string) {
    const a = await this.adjustmentRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!a) throw new NotFoundException('Payroll adjustment not found');
    return a;
  }

  createAdjustment(dto: CreatePayrollAdjustmentDto, tenantId: string, processedBy: string) {
    return this.adjustmentRepo.save(
      this.adjustmentRepo.create({
        ...dto,
        tenant_id: tenantId,
        processed_by: processedBy,
        created_by: processedBy,
      }),
    );
  }

  // ─── Reports ──────────────────────────────────────────────────────────────────

  findAllReports(tenantId: string) {
    return this.reportRepo.find({ where: { tenant_id: tenantId }, order: { generated_date: 'DESC' } });
  }

  async findOneReport(id: string, tenantId: string) {
    const r = await this.reportRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!r) throw new NotFoundException('Payroll report not found');
    return r;
  }

  createReport(dto: CreatePayrollReportDto, tenantId: string, createdBy: string) {
    return this.reportRepo.save(
      this.reportRepo.create({ ...dto, tenant_id: tenantId, created_by: createdBy }),
    );
  }

  async updateReport(id: string, dto: UpdatePayrollReportDto, tenantId: string) {
    const r = await this.findOneReport(id, tenantId);
    Object.assign(r, dto);
    return this.reportRepo.save(r);
  }
}
