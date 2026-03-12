import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SurveyService } from '../services/survey.service.js';
import {
  CreateSurveyDto,
  UpdateSurveyDto,
  CreateSurveyQuestionDto,
  SubmitSurveyResponseDto,
} from '../dto/engagement.dto.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';

@Controller('engagement/surveys')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  create(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateSurveyDto,
  ) {
    return this.surveyService.createSurvey(user.tenant_id, dto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: { tenant_id: string }) {
    return this.surveyService.findAllSurveys(user.tenant_id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.surveyService.findSurveyById(user.tenant_id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSurveyDto,
  ) {
    return this.surveyService.updateSurvey(user.tenant_id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.surveyService.deleteSurvey(user.tenant_id, id);
  }

  @Post('questions')
  addQuestion(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: CreateSurveyQuestionDto,
  ) {
    return this.surveyService.addQuestion(user.tenant_id, dto);
  }

  @Get(':id/questions')
  getQuestions(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) surveyId: string,
  ) {
    return this.surveyService.getSurveyQuestions(user.tenant_id, surveyId);
  }

  @Post('responses')
  submitResponse(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: SubmitSurveyResponseDto,
  ) {
    return this.surveyService.submitResponse(user.tenant_id, dto);
  }

  @Get(':id/participation')
  getParticipation(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) surveyId: string,
  ) {
    return this.surveyService.getParticipation(user.tenant_id, surveyId);
  }
}
