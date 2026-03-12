import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee, EmploymentStatus } from '../entities/employee.entity.js';
import { CreateEmployeeDto } from '../dto/employee/create-employee.dto.js';
import { UpdateEmployeeDto } from '../dto/employee/update-employee.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,
  ) {}

  async findAll(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.repo.findAndCount({
      where: { tenant_id: tenantId },
      order: { last_name: 'ASC', first_name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Employee> {
    const emp = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    if (!emp) throw new NotFoundException(`Employee ${id} not found`);
    return emp;
  }

  async create(dto: CreateEmployeeDto, tenantId: string): Promise<Employee> {
    const existing = await this.repo.findOne({
      where: { email: dto.email, tenant_id: tenantId },
    });
    if (existing) {
      throw new ConflictException(`Employee with email ${dto.email} already exists`);
    }
    const emp = this.repo.create({ ...dto, tenant_id: tenantId });
    return this.repo.save(emp);
  }

  async update(id: string, dto: UpdateEmployeeDto, tenantId: string): Promise<Employee> {
    const emp = await this.findOne(id, tenantId);
    Object.assign(emp, dto);
    return this.repo.save(emp);
  }

  async terminate(id: string, tenantId: string, dateOfExit?: string): Promise<Employee> {
    const emp = await this.findOne(id, tenantId);
    emp.employment_status = EmploymentStatus.TERMINATED;
    emp.is_active = false;
    if (dateOfExit) emp.date_of_exit = new Date(dateOfExit);
    return this.repo.save(emp);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const emp = await this.findOne(id, tenantId);
    await this.repo.softRemove(emp);
  }
}
