import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../entities/department.entity.js';
import { CreateDepartmentDto } from '../dto/department/create-department.dto.js';
import { UpdateDepartmentDto } from '../dto/department/update-department.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) {}

  async findAll(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.deptRepo.findAndCount({
      where: { tenant_id: tenantId },
      order: { hierarchy_level: 'ASC', name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Department> {
    const dept = await this.deptRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  async create(dto: CreateDepartmentDto, tenantId: string, userId: string): Promise<Department> {
    const dept = this.deptRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.deptRepo.save(dept);
  }

  async update(id: string, dto: UpdateDepartmentDto, tenantId: string): Promise<Department> {
    const dept = await this.findOne(id, tenantId);
    Object.assign(dept, dto);
    return this.deptRepo.save(dept);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const dept = await this.findOne(id, tenantId);
    await this.deptRepo.softRemove(dept);
  }
}
