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
import { JobService } from '../services/job.service.js';
import { CreateJobRequisitionDto } from '../dto/create-job-requisition.dto.js';
import { CreateJobPostingDto } from '../dto/create-job-posting.dto.js';

@ApiTags('Recruitment — Jobs')
@Controller('recruitment/job-requisitions')
export class JobRequisitionController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.jobService.findAllRequisitions(user.tenant_id, pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.jobService.findOneRequisition(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateJobRequisitionDto, @CurrentUser() user: User) {
    return this.jobService.createRequisition(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateJobRequisitionDto,
    @CurrentUser() user: User,
  ) {
    return this.jobService.updateRequisition(id, dto, user.tenant_id, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.jobService.removeRequisition(id, user.tenant_id);
  }
}

@ApiTags('Recruitment — Jobs')
@Controller('recruitment/job-postings')
export class JobPostingController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.jobService.findAllPostings(user.tenant_id, pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.jobService.findOnePosting(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateJobPostingDto, @CurrentUser() user: User) {
    return this.jobService.createPosting(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateJobPostingDto,
    @CurrentUser() user: User,
  ) {
    return this.jobService.updatePosting(id, dto, user.tenant_id, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.jobService.removePosting(id, user.tenant_id);
  }
}
