import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Designation } from '../entities/designation.entity.js';
import { CreateDesignationDto } from '../dto/designation/create-designation.dto.js';
import { UpdateDesignationDto } from '../dto/designation/update-designation.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';

@Injectable()
export class DesignationService {
  constructor(
    @InjectRepository(Designation)
    private readonly repo: Repository<Designation>,
  ) {}

  async findAll(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.repo.findAndCount({
      where: { tenant_id: tenantId },
      order: { title: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Designation> {
    const item = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    if (!item) throw new NotFoundException(`Designation ${id} not found`);
    return item;
  }

  async create(dto: CreateDesignationDto, tenantId: string): Promise<Designation> {
    const item = this.repo.create({ ...dto, tenant_id: tenantId });
    try {
      return await this.repo.save(item);
    } catch (e: any) {
      if (e?.code === '23505') throw new ConflictException('A designation with that code already exists');
      throw e;
    }
  }

  async update(id: string, dto: UpdateDesignationDto, tenantId: string): Promise<Designation> {
    const item = await this.findOne(id, tenantId);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const item = await this.findOne(id, tenantId);
    await this.repo.softRemove(item);
  }
}
