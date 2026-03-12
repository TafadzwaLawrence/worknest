import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../../core/entities/user.entity.js';
import { PaginationDto } from '../../core/dto/pagination.dto.js';
import { ApplicationService } from '../services/application.service.js';
import { CreateApplicationDto, UpdateApplicationStatusDto } from '../dto/application.dto.js';
import { CreatePipelineDto, CreatePipelineStageDto } from '../dto/misc.dto.js';

@ApiTags('Recruitment — Applications')
@Controller('recruitment/applications')
export class ApplicationController {
  constructor(private readonly appService: ApplicationService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.appService.findAll(user.tenant_id, pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.appService.findOne(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateApplicationDto, @CurrentUser() user: User) {
    return this.appService.create(dto, user.tenant_id, user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.appService.updateStatus(id, dto, user.tenant_id, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.appService.remove(id, user.tenant_id);
  }
}

@ApiTags('Recruitment — Pipelines')
@Controller('recruitment/pipelines')
export class PipelineController {
  constructor(private readonly appService: ApplicationService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.appService.findAllPipelines(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.appService.findOnePipeline(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreatePipelineDto, @CurrentUser() user: User) {
    return this.appService.createPipeline(dto, user.tenant_id, user.id);
  }

  @Get(':id/stages')
  getStages(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.appService.getPipelineStages(id, user.tenant_id);
  }

  @Post(':id/stages')
  addStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePipelineStageDto,
    @CurrentUser() user: User,
  ) {
    return this.appService.addStage(id, dto, user.tenant_id);
  }
}
