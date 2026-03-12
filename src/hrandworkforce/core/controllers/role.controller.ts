import {
  Body,
  Controller,
  Delete,
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
import { CreateRoleDto } from '../dto/role/create-role.dto.js';
import { UpdateRoleDto } from '../dto/role/update-role.dto.js';
import { AssignRoleDto } from '../dto/role/assign-role.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';
import { RoleService } from '../services/role.service.js';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RoleController {
  constructor(private readonly svc: RoleService) {}

  @Get()
  @ApiOperation({ summary: 'List all roles for the current tenant' })
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.svc.findAll(user.tenant_id, pagination);
  }

  // NOTE: Literal routes must come before parameterised :id route
  @Get('user/:userId')
  @ApiOperation({ summary: "List all roles assigned to a user" })
  findUserRoles(
    @CurrentUser() user: User,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.svc.findUserRoles(userId, user.tenant_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id, user.tenant_id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a role' })
  create(@CurrentUser() user: User, @Body() dto: CreateRoleDto) {
    return this.svc.create(dto, user.tenant_id);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign a role to a user' })
  assign(@CurrentUser() user: User, @Body() dto: AssignRoleDto) {
    return this.svc.assignToUser(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.svc.update(id, dto, user.tenant_id);
  }

  @Delete(':roleId/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a role assignment from a user' })
  removeFromUser(
    @CurrentUser() user: User,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.svc.removeFromUser(userId, roleId, user.tenant_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a role' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id, user.tenant_id);
  }
}
