import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkLocation } from '../entities/work-location.entity.js';
import { CreateWorkLocationDto } from '../dto/work-location/create-work-location.dto.js';
import { UpdateWorkLocationDto } from '../dto/work-location/update-work-location.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';

@Injectable()
export class WorkLocationService {
  constructor(
    @InjectRepository(WorkLocation)
    private readonly repo: Repository<WorkLocation>,
  ) {}

  async findAll(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.repo.findAndCount({
      where: { tenant_id: tenantId },
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<WorkLocation> {
    const item = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    if (!item) throw new NotFoundException(`Work location ${id} not found`);
    return item;
  }

  async create(dto: CreateWorkLocationDto, tenantId: string): Promise<WorkLocation> {
    const item = this.repo.create({ ...dto, tenant_id: tenantId });
    try {
      return await this.repo.save(item);
    } catch (e: any) {
      if (e?.code === '23505') throw new ConflictException('A work location with that code already exists');
      throw e;
    }
  }

  async update(id: string, dto: UpdateWorkLocationDto, tenantId: string): Promise<WorkLocation> {
    const item = await this.findOne(id, tenantId);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const item = await this.findOne(id, tenantId);
    await this.repo.softRemove(item);
  }
}
