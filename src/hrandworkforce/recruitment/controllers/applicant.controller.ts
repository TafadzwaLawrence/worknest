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
import { ApplicantService } from '../services/applicant.service.js';
import { CreateApplicantDto } from '../dto/create-applicant.dto.js';
import { CreateApplicantContactDto } from '../dto/application.dto.js';

@ApiTags('Recruitment — Applicants')
@Controller('recruitment/applicants')
export class ApplicantController {
  constructor(private readonly applicantService: ApplicantService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.applicantService.findAll(user.tenant_id, pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.applicantService.findOne(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateApplicantDto, @CurrentUser() user: User) {
    return this.applicantService.create(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateApplicantDto,
    @CurrentUser() user: User,
  ) {
    return this.applicantService.update(id, dto, user.tenant_id, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.applicantService.remove(id, user.tenant_id);
  }

  @Get(':id/contacts')
  getContacts(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.applicantService.getContacts(id, user.tenant_id);
  }

  @Post(':id/contacts')
  addContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateApplicantContactDto,
    @CurrentUser() user: User,
  ) {
    return this.applicantService.addContact(id, dto, user.tenant_id, user.id);
  }

  @Delete(':id/contacts/:contactId')
  removeContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @CurrentUser() user: User,
  ) {
    return this.applicantService.removeContact(id, contactId, user.tenant_id);
  }

  @Get(':id/documents')
  getDocuments(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.applicantService.getDocuments(id, user.tenant_id);
  }
}
