import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayStructure } from '../entities/pay-structure.entity.js';
import { EmployeeTaxInfo } from '../entities/employee-tax-info.entity.js';
import { TaxJurisdiction } from '../entities/tax-jurisdiction.entity.js';
import {
  CreatePayStructureDto,
  UpdatePayStructureDto,
  UpsertEmployeeTaxInfoDto,
  CreateTaxJurisdictionDto,
  UpdateTaxJurisdictionDto,
} from '../dto/payroll.dto.js';

@Injectable()
export class CompensationService {
  constructor(
    @InjectRepository(PayStructure)
    private readonly payStructureRepo: Repository<PayStructure>,
    @InjectRepository(EmployeeTaxInfo)
    private readonly taxInfoRepo: Repository<EmployeeTaxInfo>,
    @InjectRepository(TaxJurisdiction)
    private readonly jurisdictionRepo: Repository<TaxJurisdiction>,
  ) {}

  // ─── Pay Structures ───────────────────────────────────────────────────────────

  findAllPayStructures(tenantId: string, employeeId?: string) {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (employeeId) where['employee_id'] = employeeId;
    return this.payStructureRepo.find({ where, order: { effective_date: 'DESC' } });
  }

  async findOnePayStructure(id: string, tenantId: string) {
    const ps = await this.payStructureRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!ps) throw new NotFoundException('Pay structure not found');
    return ps;
  }

  createPayStructure(dto: CreatePayStructureDto, tenantId: string, createdBy: string) {
    return this.payStructureRepo.save(
      this.payStructureRepo.create({ ...dto, tenant_id: tenantId, created_by: createdBy }),
    );
  }

  async updatePayStructure(id: string, dto: UpdatePayStructureDto, tenantId: string) {
    const ps = await this.findOnePayStructure(id, tenantId);
    Object.assign(ps, dto);
    return this.payStructureRepo.save(ps);
  }

  async removePayStructure(id: string, tenantId: string) {
    const ps = await this.findOnePayStructure(id, tenantId);
    return this.payStructureRepo.softRemove(ps);
  }

  // ─── Employee Tax Info ────────────────────────────────────────────────────────

  async findTaxInfo(employeeId: string, tenantId: string) {
    const info = await this.taxInfoRepo.findOne({
      where: { employee_id: employeeId, tenant_id: tenantId },
    });
    if (!info) throw new NotFoundException('Tax info not found');
    return info;
  }

  async upsertTaxInfo(dto: UpsertEmployeeTaxInfoDto, tenantId: string) {
    const existing = await this.taxInfoRepo.findOne({
      where: { employee_id: dto.employee_id, tenant_id: tenantId },
    });
    if (existing) {
      Object.assign(existing, dto);
      return this.taxInfoRepo.save(existing);
    }
    return this.taxInfoRepo.save(this.taxInfoRepo.create({ ...dto, tenant_id: tenantId }));
  }

  // ─── Tax Jurisdictions ────────────────────────────────────────────────────────

  findAllJurisdictions(tenantId: string) {
    return this.jurisdictionRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findOneJurisdiction(id: string, tenantId: string) {
    const j = await this.jurisdictionRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!j) throw new NotFoundException('Tax jurisdiction not found');
    return j;
  }

  createJurisdiction(dto: CreateTaxJurisdictionDto, tenantId: string) {
    return this.jurisdictionRepo.save(this.jurisdictionRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async updateJurisdiction(id: string, dto: UpdateTaxJurisdictionDto, tenantId: string) {
    const j = await this.findOneJurisdiction(id, tenantId);
    Object.assign(j, dto);
    return this.jurisdictionRepo.save(j);
  }

  async removeJurisdiction(id: string, tenantId: string) {
    const j = await this.findOneJurisdiction(id, tenantId);
    return this.jurisdictionRepo.remove(j);
  }
}
