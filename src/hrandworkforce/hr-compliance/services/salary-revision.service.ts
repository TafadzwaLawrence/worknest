import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryRevision } from '../entities/salary-revision.entity.js';
import { CreateSalaryRevisionDto } from '../dto/hr-compliance.dto.js';

@Injectable()
export class SalaryRevisionService {
  constructor(
    @InjectRepository(SalaryRevision)
    private readonly revisionRepo: Repository<SalaryRevision>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateSalaryRevisionDto,
  ): Promise<SalaryRevision> {
    const revision = this.revisionRepo.create({
      ...dto,
      tenant_id: tenantId,
      revised_by: userId,
    });
    return this.revisionRepo.save(revision);
  }

  async findByEmployee(
    tenantId: string,
    employeeId: string,
  ): Promise<SalaryRevision[]> {
    return this.revisionRepo.find({
      where: { tenant_id: tenantId, employee_id: employeeId },
      order: { effective_date: 'DESC' },
    });
  }

  async findAll(tenantId: string): Promise<SalaryRevision[]> {
    return this.revisionRepo.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<SalaryRevision> {
    const revision = await this.revisionRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!revision) throw new NotFoundException(`Salary revision ${id} not found`);
    return revision;
  }
}
