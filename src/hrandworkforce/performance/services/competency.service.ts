import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetencyFramework } from '../entities/competency-framework.entity.js';
import { Competency } from '../entities/competency.entity.js';
import { EmployeeCompetency } from '../entities/employee-competency.entity.js';
import { Skill } from '../entities/skill.entity.js';
import { EmployeeSkill } from '../entities/employee-skill.entity.js';
import {
  CreateCompetencyFrameworkDto,
  UpdateCompetencyFrameworkDto,
  CreateCompetencyDto,
  UpdateCompetencyDto,
  CreateEmployeeCompetencyDto,
  UpdateEmployeeCompetencyDto,
  CreateSkillDto,
  UpdateSkillDto,
  CreateEmployeeSkillDto,
  UpdateEmployeeSkillDto,
} from '../dto/performance.dto.js';

@Injectable()
export class CompetencyService {
  constructor(
    @InjectRepository(CompetencyFramework)
    private readonly frameworkRepo: Repository<CompetencyFramework>,
    @InjectRepository(Competency)
    private readonly competencyRepo: Repository<Competency>,
    @InjectRepository(EmployeeCompetency)
    private readonly empCompetencyRepo: Repository<EmployeeCompetency>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(EmployeeSkill)
    private readonly empSkillRepo: Repository<EmployeeSkill>,
  ) {}

  // ─── Frameworks ─────────────────────────────────────────────────────────────

  async createFramework(tenantId: string, dto: CreateCompetencyFrameworkDto, userId: string): Promise<CompetencyFramework> {
    const fw = this.frameworkRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.frameworkRepo.save(fw);
  }

  async findAllFrameworks(tenantId: string): Promise<CompetencyFramework[]> {
    return this.frameworkRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findFramework(tenantId: string, id: string): Promise<CompetencyFramework> {
    const fw = await this.frameworkRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!fw) throw new NotFoundException('Competency framework not found');
    return fw;
  }

  async updateFramework(tenantId: string, id: string, dto: UpdateCompetencyFrameworkDto): Promise<CompetencyFramework> {
    const fw = await this.findFramework(tenantId, id);
    Object.assign(fw, dto);
    return this.frameworkRepo.save(fw);
  }

  async removeFramework(tenantId: string, id: string): Promise<void> {
    const fw = await this.findFramework(tenantId, id);
    await this.frameworkRepo.softRemove(fw);
  }

  // ─── Competencies ────────────────────────────────────────────────────────────

  async createCompetency(tenantId: string, dto: CreateCompetencyDto, userId: string): Promise<Competency> {
    const c = this.competencyRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.competencyRepo.save(c);
  }

  async findAllCompetencies(tenantId: string, frameworkId?: string): Promise<Competency[]> {
    const where: Record<string, unknown> = { tenant_id: tenantId };
    if (frameworkId) where.framework_id = frameworkId;
    return this.competencyRepo.find({ where, order: { name: 'ASC' } });
  }

  async findCompetency(tenantId: string, id: string): Promise<Competency> {
    const c = await this.competencyRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!c) throw new NotFoundException('Competency not found');
    return c;
  }

  async updateCompetency(tenantId: string, id: string, dto: UpdateCompetencyDto): Promise<Competency> {
    const c = await this.findCompetency(tenantId, id);
    Object.assign(c, dto);
    return this.competencyRepo.save(c);
  }

  async removeCompetency(tenantId: string, id: string): Promise<void> {
    const c = await this.findCompetency(tenantId, id);
    await this.competencyRepo.softRemove(c);
  }

  // ─── Employee Competencies ───────────────────────────────────────────────────

  async addEmployeeCompetency(tenantId: string, dto: CreateEmployeeCompetencyDto): Promise<EmployeeCompetency> {
    const existing = await this.empCompetencyRepo.findOne({
      where: { employee_id: dto.employee_id, competency_id: dto.competency_id },
    });
    if (existing) throw new ConflictException('Employee competency record already exists');
    const ec = this.empCompetencyRepo.create({ ...dto, tenant_id: tenantId });
    return this.empCompetencyRepo.save(ec);
  }

  async findEmployeeCompetencies(tenantId: string, employeeId: string): Promise<EmployeeCompetency[]> {
    return this.empCompetencyRepo.find({ where: { tenant_id: tenantId, employee_id: employeeId } });
  }

  async updateEmployeeCompetency(id: string, dto: UpdateEmployeeCompetencyDto): Promise<EmployeeCompetency> {
    const ec = await this.empCompetencyRepo.findOne({ where: { id } });
    if (!ec) throw new NotFoundException('Employee competency not found');
    Object.assign(ec, dto);
    return this.empCompetencyRepo.save(ec);
  }

  async removeEmployeeCompetency(id: string): Promise<void> {
    const ec = await this.empCompetencyRepo.findOne({ where: { id } });
    if (!ec) throw new NotFoundException('Employee competency not found');
    await this.empCompetencyRepo.remove(ec);
  }

  // ─── Skills ──────────────────────────────────────────────────────────────────

  async createSkill(tenantId: string, dto: CreateSkillDto, userId: string): Promise<Skill> {
    const skill = this.skillRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.skillRepo.save(skill);
  }

  async findAllSkills(tenantId: string): Promise<Skill[]> {
    return this.skillRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findSkill(tenantId: string, id: string): Promise<Skill> {
    const skill = await this.skillRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!skill) throw new NotFoundException('Skill not found');
    return skill;
  }

  async updateSkill(tenantId: string, id: string, dto: UpdateSkillDto): Promise<Skill> {
    const skill = await this.findSkill(tenantId, id);
    Object.assign(skill, dto);
    return this.skillRepo.save(skill);
  }

  async removeSkill(tenantId: string, id: string): Promise<void> {
    const skill = await this.findSkill(tenantId, id);
    await this.skillRepo.softRemove(skill);
  }

  // ─── Employee Skills ─────────────────────────────────────────────────────────

  async addEmployeeSkill(tenantId: string, dto: CreateEmployeeSkillDto): Promise<EmployeeSkill> {
    const existing = await this.empSkillRepo.findOne({
      where: { employee_id: dto.employee_id, skill_id: dto.skill_id },
    });
    if (existing) throw new ConflictException('Employee skill record already exists');
    const es = this.empSkillRepo.create({ ...dto, tenant_id: tenantId });
    return this.empSkillRepo.save(es);
  }

  async findEmployeeSkills(tenantId: string, employeeId: string): Promise<EmployeeSkill[]> {
    return this.empSkillRepo.find({ where: { tenant_id: tenantId, employee_id: employeeId } });
  }

  async updateEmployeeSkill(id: string, dto: UpdateEmployeeSkillDto): Promise<EmployeeSkill> {
    const es = await this.empSkillRepo.findOne({ where: { id } });
    if (!es) throw new NotFoundException('Employee skill not found');
    Object.assign(es, dto);
    return this.empSkillRepo.save(es);
  }

  async removeEmployeeSkill(id: string): Promise<void> {
    const es = await this.empSkillRepo.findOne({ where: { id } });
    if (!es) throw new NotFoundException('Employee skill not found');
    await this.empSkillRepo.remove(es);
  }
}
