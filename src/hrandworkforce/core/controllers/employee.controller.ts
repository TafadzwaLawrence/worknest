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
import { CreateEmployeeDto } from '../dto/employee/create-employee.dto.js';
import { UpdateEmployeeDto } from '../dto/employee/update-employee.dto.js';
import { TerminateEmployeeDto } from '../dto/employee/terminate-employee.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';
import { EmployeeService } from '../services/employee.service.js';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeeController {
  constructor(private readonly svc: EmployeeService) {}

  @Get()
  @ApiOperation({ summary: 'List all employees for the current tenant' })
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.svc.findAll(user.tenant_id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an employee by ID' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id, user.tenant_id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an employee record' })
  create(@CurrentUser() user: User, @Body() dto: CreateEmployeeDto) {
    return this.svc.create(dto, user.tenant_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an employee record' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.svc.update(id, dto, user.tenant_id);
  }

  @Post(':id/terminate')
  @ApiOperation({ summary: 'Terminate an employee' })
  terminate(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TerminateEmployeeDto,
  ) {
    return this.svc.terminate(id, user.tenant_id, dto.date_of_exit);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an employee record' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id, user.tenant_id);
  }
}
