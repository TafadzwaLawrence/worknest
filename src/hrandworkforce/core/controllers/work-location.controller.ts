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
import { CreateWorkLocationDto } from '../dto/work-location/create-work-location.dto.js';
import { UpdateWorkLocationDto } from '../dto/work-location/update-work-location.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';
import { WorkLocationService } from '../services/work-location.service.js';

@ApiTags('Work Locations')
@ApiBearerAuth()
@Controller('work-locations')
export class WorkLocationController {
  constructor(private readonly svc: WorkLocationService) {}

  @Get()
  @ApiOperation({ summary: 'List all work locations for the current tenant' })
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.svc.findAll(user.tenant_id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a work location by ID' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id, user.tenant_id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a work location' })
  create(@CurrentUser() user: User, @Body() dto: CreateWorkLocationDto) {
    return this.svc.create(dto, user.tenant_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a work location' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkLocationDto,
  ) {
    return this.svc.update(id, dto, user.tenant_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a work location' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id, user.tenant_id);
  }
}
