import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../entities/user.entity.js';
import { CreateTenantDto } from '../dto/tenant/create-tenant.dto.js';
import { UpdateTenantDto } from '../dto/tenant/update-tenant.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';
import { TenantService } from '../services/tenant.service.js';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @ApiOperation({ summary: 'List all tenants (super admin only)' })
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    if (!user.is_super_admin) throw new ForbiddenException('Super admin access required');
    return this.tenantService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant by ID (super admin only)' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    if (!user.is_super_admin) throw new ForbiddenException('Super admin access required');
    return this.tenantService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tenant (super admin only)' })
  create(@CurrentUser() user: User, @Body() dto: CreateTenantDto) {
    if (!user.is_super_admin) throw new ForbiddenException('Super admin access required');
    return this.tenantService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant (super admin only)' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    if (!user.is_super_admin) throw new ForbiddenException('Super admin access required');
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a tenant (super admin only)' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    if (!user.is_super_admin) throw new ForbiddenException('Super admin access required');
    return this.tenantService.remove(id);
  }
}
