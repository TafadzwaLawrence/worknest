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
import { CreateDepartmentDto } from '../dto/department/create-department.dto.js';
import { UpdateDepartmentDto } from '../dto/department/update-department.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';
import { DepartmentService } from '../services/department.service.js';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentController {
  constructor(private readonly deptService: DepartmentService) {}

  @Get()
  @ApiOperation({ summary: 'List all departments for the current tenant' })
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.deptService.findAll(user.tenant_id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a department by ID' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.deptService.findOne(id, user.tenant_id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a department' })
  create(@CurrentUser() user: User, @Body() dto: CreateDepartmentDto) {
    return this.deptService.create(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a department' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.deptService.update(id, dto, user.tenant_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a department' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.deptService.remove(id, user.tenant_id);
  }
}
