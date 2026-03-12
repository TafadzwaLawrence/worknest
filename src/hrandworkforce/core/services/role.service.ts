import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity.js';
import { UserRole } from '../entities/user-role.entity.js';
import { CreateRoleDto } from '../dto/role/create-role.dto.js';
import { UpdateRoleDto } from '../dto/role/update-role.dto.js';
import { AssignRoleDto } from '../dto/role/assign-role.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async findAll(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.roleRepo.findAndCount({
      where: { tenant_id: tenantId },
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Role> {
    const role = await this.roleRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async create(dto: CreateRoleDto, tenantId: string): Promise<Role> {
    const existing = await this.roleRepo.findOne({
      where: { code: dto.code, tenant_id: tenantId },
    });
    if (existing) throw new ConflictException(`Role with code '${dto.code}' already exists`);
    const role = this.roleRepo.create({ ...dto, tenant_id: tenantId });
    return this.roleRepo.save(role);
  }

  async update(id: string, dto: UpdateRoleDto, tenantId: string): Promise<Role> {
    const role = await this.findOne(id, tenantId);
    Object.assign(role, dto);
    return this.roleRepo.save(role);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const role = await this.findOne(id, tenantId);
    if (role.is_system_role) {
      throw new ConflictException('System roles cannot be deleted');
    }
    await this.roleRepo.softRemove(role);
  }

  async assignToUser(dto: AssignRoleDto, tenantId: string, assignedBy: string): Promise<UserRole> {
    const existing = await this.userRoleRepo.findOne({
      where: { user_id: dto.userId, role_id: dto.roleId, tenant_id: tenantId },
    });
    if (existing) throw new ConflictException('Role is already assigned to this user');

    const userRole = this.userRoleRepo.create({
      user_id: dto.userId,
      role_id: dto.roleId,
      tenant_id: tenantId,
      assigned_by: assignedBy,
    });

    try {
      return await this.userRoleRepo.save(userRole);
    } catch (error: unknown) {
      const dbError = error as { code?: string };
      if (dbError.code === '23503') {
        throw new BadRequestException('Invalid user ID or role ID');
      }
      throw error;
    }
  }

  async removeFromUser(userId: string, roleId: string, tenantId: string): Promise<void> {
    const userRole = await this.userRoleRepo.findOne({
      where: { user_id: userId, role_id: roleId, tenant_id: tenantId },
    });
    if (!userRole) throw new NotFoundException('Role assignment not found');
    await this.userRoleRepo.remove(userRole);
  }

  async findUserRoles(userId: string, tenantId: string): Promise<UserRole[]> {
    return this.userRoleRepo.find({
      where: { user_id: userId, tenant_id: tenantId },
      relations: ['role'],
    });
  }
}
