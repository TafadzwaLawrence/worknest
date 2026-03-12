import {
  Body,
  Controller,
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
import { InterviewOfferService } from '../services/interview-offer.service.js';
import {
  AddInterviewerDto,
  CreateInterviewDto,
  UpdateInterviewDto,
} from '../dto/interview.dto.js';
import { CreateOfferDto, UpdateOfferStatusDto } from '../dto/offer.dto.js';
import {
  CreateEvaluationDto,
  CreateNoteDto,
  CreateTagDto,
} from '../dto/misc.dto.js';

@ApiTags('Recruitment — Interviews')
@Controller('recruitment/interviews')
export class InterviewController {
  constructor(private readonly service: InterviewOfferService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.service.findAllInterviews(user.tenant_id, pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.service.findOneInterview(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateInterviewDto, @CurrentUser() user: User) {
    return this.service.createInterview(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterviewDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateInterview(id, dto, user.tenant_id);
  }

  @Get(':id/interviewers')
  getInterviewers(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.service.getInterviewers(id, user.tenant_id);
  }

  @Post(':id/interviewers')
  addInterviewer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddInterviewerDto,
    @CurrentUser() user: User,
  ) {
    return this.service.addInterviewer(id, dto, user.tenant_id);
  }
}

@ApiTags('Recruitment — Offers')
@Controller('recruitment/offers')
export class OfferController {
  constructor(private readonly service: InterviewOfferService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.service.findAllOffers(user.tenant_id, pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.service.findOneOffer(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateOfferDto, @CurrentUser() user: User) {
    return this.service.createOffer(dto, user.tenant_id, user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateOfferStatus(id, dto, user.tenant_id);
  }
}

@ApiTags('Recruitment — Evaluations & Notes')
@Controller('recruitment')
export class RecruitmentMiscController {
  constructor(private readonly service: InterviewOfferService) {}

  @Post('evaluations')
  createEvaluation(@Body() dto: CreateEvaluationDto, @CurrentUser() user: User) {
    return this.service.createEvaluation(dto, user.tenant_id, user.id);
  }

  @Get('applications/:id/evaluations')
  findEvaluations(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.service.findEvaluations(id, user.tenant_id);
  }

  @Post('notes')
  createNote(@Body() dto: CreateNoteDto, @CurrentUser() user: User) {
    return this.service.createNote(dto, user.tenant_id, user.id);
  }

  @Get('notes')
  findNotes(
    @Query('parent_type') parentType: string,
    @Query('parent_id') parentId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.findNotes(parentType, parentId, user.tenant_id);
  }

  @Get('tags')
  findAllTags(@CurrentUser() user: User) {
    return this.service.findAllTags(user.tenant_id);
  }

  @Post('tags')
  createTag(@Body() dto: CreateTagDto, @CurrentUser() user: User) {
    return this.service.createTag(dto, user.tenant_id);
  }

  @Post('tags/:tagId/items')
  tagItem(
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @Body() body: { item_type: string; item_id: string },
    @CurrentUser() user: User,
  ) {
    return this.service.tagItem(tagId, body.item_type, body.item_id, user.tenant_id, user.id);
  }

  @Post('tags/:tagId/items/remove')
  untagItem(
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @Body() body: { item_type: string; item_id: string },
    @CurrentUser() user: User,
  ) {
    return this.service.untagItem(tagId, body.item_type, body.item_id, user.tenant_id);
  }
}
