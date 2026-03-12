import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BenefitPlan } from '../entities/benefit-plan.entity.js';
import { BenefitEnrollment } from '../entities/benefit-enrollment.entity.js';
import { Dependent } from '../entities/dependent.entity.js';
import {
  CreateBenefitPlanDto,
  UpdateBenefitPlanDto,
  CreateBenefitEnrollmentDto,
  UpdateBenefitEnrollmentDto,
  CreateDependentDto,
  UpdateDependentDto,
} from '../dto/payroll.dto.js';

@Injectable()
export class BenefitsService {
  constructor(
    @InjectRepository(BenefitPlan)
    private readonly planRepo: Repository<BenefitPlan>,
    @InjectRepository(BenefitEnrollment)
    private readonly enrollmentRepo: Repository<BenefitEnrollment>,
    @InjectRepository(Dependent)
    private readonly dependentRepo: Repository<Dependent>,
  ) {}

  // ─── Benefit Plans ────────────────────────────────────────────────────────────

  findAllPlans(tenantId: string, activeOnly = false) {
    const where: Record<string, unknown> = { tenant_id: tenantId };
    if (activeOnly) where['is_active'] = true;
    return this.planRepo.find({ where, order: { name: 'ASC' } });
  }

  async findOnePlan(id: string, tenantId: string) {
    const p = await this.planRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!p) throw new NotFoundException('Benefit plan not found');
    return p;
  }

  createPlan(dto: CreateBenefitPlanDto, tenantId: string, createdBy: string) {
    return this.planRepo.save(
      this.planRepo.create({ ...dto, tenant_id: tenantId, created_by: createdBy }),
    );
  }

  async updatePlan(id: string, dto: UpdateBenefitPlanDto, tenantId: string) {
    const p = await this.findOnePlan(id, tenantId);
    Object.assign(p, dto);
    return this.planRepo.save(p);
  }

  async removePlan(id: string, tenantId: string) {
    const p = await this.findOnePlan(id, tenantId);
    return this.planRepo.softRemove(p);
  }

  // ─── Benefit Enrollments ──────────────────────────────────────────────────────

  findEnrollments(tenantId: string, employeeId?: string) {
    const where: Record<string, string> = { tenant_id: tenantId };
    if (employeeId) where['employee_id'] = employeeId;
    return this.enrollmentRepo.find({ where, order: { effective_date: 'DESC' } });
  }

  async findOneEnrollment(id: string, tenantId: string) {
    const e = await this.enrollmentRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!e) throw new NotFoundException('Benefit enrollment not found');
    return e;
  }

  createEnrollment(dto: CreateBenefitEnrollmentDto, tenantId: string, createdBy: string) {
    return this.enrollmentRepo.save(
      this.enrollmentRepo.create({ ...dto, tenant_id: tenantId, created_by: createdBy }),
    );
  }

  async updateEnrollment(id: string, dto: UpdateBenefitEnrollmentDto, tenantId: string) {
    const e = await this.findOneEnrollment(id, tenantId);
    Object.assign(e, dto);
    return this.enrollmentRepo.save(e);
  }

  async terminateEnrollment(id: string, endDate: string, tenantId: string) {
    const e = await this.findOneEnrollment(id, tenantId);
    e.is_active = false;
    e.end_date = endDate;
    return this.enrollmentRepo.save(e);
  }

  // ─── Dependents ───────────────────────────────────────────────────────────────

  findDependents(employeeId: string, tenantId: string) {
    return this.dependentRepo.find({ where: { employee_id: employeeId, tenant_id: tenantId } });
  }

  async findOneDependent(id: string, tenantId: string) {
    const d = await this.dependentRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!d) throw new NotFoundException('Dependent not found');
    return d;
  }

  createDependent(dto: CreateDependentDto, tenantId: string) {
    return this.dependentRepo.save(this.dependentRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async updateDependent(id: string, dto: UpdateDependentDto, tenantId: string) {
    const d = await this.findOneDependent(id, tenantId);
    Object.assign(d, dto);
    return this.dependentRepo.save(d);
  }

  async removeDependent(id: string, tenantId: string) {
    const d = await this.findOneDependent(id, tenantId);
    return this.dependentRepo.softRemove(d);
  }
}
