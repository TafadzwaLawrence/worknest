import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayPeriod } from '../entities/pay-period.entity.js';
import { PayrollRun } from '../entities/payroll-run.entity.js';
import { PayrollRecord } from '../entities/payroll-record.entity.js';
import { PayrollEarning } from '../entities/payroll-earning.entity.js';
import { PayrollDeduction } from '../entities/payroll-deduction.entity.js';
import { PayrollTax } from '../entities/payroll-tax.entity.js';
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
import { PayrollStatus } from '../payroll.enums.js';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayPeriod)
    private readonly periodRepo: Repository<PayPeriod>,
    @InjectRepository(PayrollRun)
    private readonly runRepo: Repository<PayrollRun>,
    @InjectRepository(PayrollRecord)
    private readonly recordRepo: Repository<PayrollRecord>,
    @InjectRepository(PayrollEarning)
    private readonly earningRepo: Repository<PayrollEarning>,
    @InjectRepository(PayrollDeduction)
    private readonly deductionRepo: Repository<PayrollDeduction>,
    @InjectRepository(PayrollTax)
    private readonly taxRepo: Repository<PayrollTax>,
  ) {}

  // ─── Pay Periods ──────────────────────────────────────────────────────────────

  findAllPeriods(tenantId: string) {
    return this.periodRepo.find({ where: { tenant_id: tenantId }, order: { start_date: 'DESC' } });
  }

  async findOnePeriod(id: string, tenantId: string) {
    const p = await this.periodRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!p) throw new NotFoundException('Pay period not found');
    return p;
  }

  createPeriod(dto: CreatePayPeriodDto, tenantId: string, createdBy: string) {
    return this.periodRepo.save(
      this.periodRepo.create({ ...dto, tenant_id: tenantId, created_by: createdBy }),
    );
  }

  async updatePeriod(id: string, dto: UpdatePayPeriodDto, tenantId: string) {
    const p = await this.findOnePeriod(id, tenantId);
    Object.assign(p, dto);
    return this.periodRepo.save(p);
  }

  // ─── Payroll Runs ─────────────────────────────────────────────────────────────

  findRuns(tenantId: string, periodId?: string) {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (periodId) where['pay_period_id'] = periodId;
    return this.runRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async findOneRun(id: string, tenantId: string) {
    const r = await this.runRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!r) throw new NotFoundException('Payroll run not found');
    return r;
  }

  createRun(dto: CreatePayrollRunDto, tenantId: string, createdBy: string) {
    return this.runRepo.save(
      this.runRepo.create({ ...dto, tenant_id: tenantId, created_by: createdBy }),
    );
  }

  async updateRunStatus(id: string, dto: UpdatePayrollRunStatusDto, userId: string, tenantId: string) {
    const run = await this.findOneRun(id, tenantId);
    run.status = dto.status;
    if (dto.status === PayrollStatus.PROCESSED) {
      run.processed_by = userId;
      run.processed_at = new Date();
    } else if (dto.status === PayrollStatus.APPROVED) {
      run.approved_by = userId;
      run.approved_at = new Date();
    }
    return this.runRepo.save(run);
  }

  // ─── Payroll Records ──────────────────────────────────────────────────────────

  findRecords(runId: string, tenantId: string) {
    return this.recordRepo.find({
      where: { payroll_run_id: runId, tenant_id: tenantId },
      order: { created_at: 'ASC' },
    });
  }

  async findOneRecord(id: string, tenantId: string) {
    const r = await this.recordRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!r) throw new NotFoundException('Payroll record not found');
    return r;
  }

  createRecord(runId: string, dto: CreatePayrollRecordDto, tenantId: string) {
    return this.recordRepo.save(
      this.recordRepo.create({ ...dto, payroll_run_id: runId, tenant_id: tenantId }),
    );
  }

  async updateRecord(id: string, dto: UpdatePayrollRecordDto, tenantId: string) {
    const r = await this.findOneRecord(id, tenantId);
    Object.assign(r, dto);
    return this.recordRepo.save(r);
  }

  // ─── Earnings ─────────────────────────────────────────────────────────────────

  findEarnings(recordId: string, tenantId: string) {
    return this.earningRepo.find({ where: { payroll_record_id: recordId, tenant_id: tenantId } });
  }

  addEarning(recordId: string, dto: CreatePayrollEarningDto, tenantId: string) {
    return this.earningRepo.save(
      this.earningRepo.create({ ...dto, payroll_record_id: recordId, tenant_id: tenantId }),
    );
  }

  async removeEarning(id: string, tenantId: string) {
    const e = await this.earningRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!e) throw new NotFoundException('Earning not found');
    return this.earningRepo.remove(e);
  }

  // ─── Deductions ───────────────────────────────────────────────────────────────

  findDeductions(recordId: string, tenantId: string) {
    return this.deductionRepo.find({ where: { payroll_record_id: recordId, tenant_id: tenantId } });
  }

  addDeduction(recordId: string, dto: CreatePayrollDeductionDto, tenantId: string) {
    return this.deductionRepo.save(
      this.deductionRepo.create({ ...dto, payroll_record_id: recordId, tenant_id: tenantId }),
    );
  }

  async removeDeduction(id: string, tenantId: string) {
    const d = await this.deductionRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!d) throw new NotFoundException('Deduction not found');
    return this.deductionRepo.remove(d);
  }

  // ─── Taxes ────────────────────────────────────────────────────────────────────

  findTaxes(recordId: string, tenantId: string) {
    return this.taxRepo.find({ where: { payroll_record_id: recordId, tenant_id: tenantId } });
  }

  addTax(recordId: string, dto: CreatePayrollTaxDto, tenantId: string) {
    return this.taxRepo.save(
      this.taxRepo.create({ ...dto, payroll_record_id: recordId, tenant_id: tenantId }),
    );
  }
}
