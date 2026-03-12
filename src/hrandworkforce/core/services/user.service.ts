import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { UpdateUserDto } from '../dto/user/update-user.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.repo.findAndCount({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, tenantId: string): Promise<User> {
    const user = await this.findOne(id, tenantId);
    Object.assign(user, dto);
    return this.repo.save(user);
  }

  async deactivate(id: string, tenantId: string): Promise<User> {
    const user = await this.findOne(id, tenantId);
    user.is_active = false;
    return this.repo.save(user);
  }

  async activate(id: string, tenantId: string): Promise<User> {
    const user = await this.findOne(id, tenantId);
    user.is_active = true;
    return this.repo.save(user);
  }
}
