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
import { CreateDesignationDto } from '../dto/designation/create-designation.dto.js';
import { UpdateDesignationDto } from '../dto/designation/update-designation.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';
import { DesignationService } from '../services/designation.service.js';

@ApiTags('Designations')
@ApiBearerAuth()
@Controller('designations')
export class DesignationController {
  constructor(private readonly svc: DesignationService) {}

  @Get()
  @ApiOperation({ summary: 'List all designations for the current tenant' })
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.svc.findAll(user.tenant_id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a designation by ID' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id, user.tenant_id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a designation' })
  create(@CurrentUser() user: User, @Body() dto: CreateDesignationDto) {
    return this.svc.create(dto, user.tenant_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a designation' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDesignationDto,
  ) {
    return this.svc.update(id, dto, user.tenant_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a designation' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id, user.tenant_id);
  }
}
