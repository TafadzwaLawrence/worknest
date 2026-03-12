import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EngagementSurvey } from '../entities/engagement-survey.entity.js';
import { SurveyQuestion } from '../entities/survey-question.entity.js';
import { SurveyResponse } from '../entities/survey-response.entity.js';
import { SurveyParticipation } from '../entities/survey-participation.entity.js';
import {
  CreateSurveyDto,
  UpdateSurveyDto,
  CreateSurveyQuestionDto,
  SubmitSurveyResponseDto,
} from '../dto/engagement.dto.js';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(EngagementSurvey)
    private readonly surveyRepo: Repository<EngagementSurvey>,
    @InjectRepository(SurveyQuestion)
    private readonly questionRepo: Repository<SurveyQuestion>,
    @InjectRepository(SurveyResponse)
    private readonly responseRepo: Repository<SurveyResponse>,
    @InjectRepository(SurveyParticipation)
    private readonly participationRepo: Repository<SurveyParticipation>,
  ) {}

  async createSurvey(tenantId: string, dto: CreateSurveyDto, userId: string): Promise<EngagementSurvey> {
    const survey = this.surveyRepo.create({
      tenant_id: tenantId,
      created_by: userId,
      ...dto,
    });
    return this.surveyRepo.save(survey);
  }

  async findAllSurveys(tenantId: string): Promise<EngagementSurvey[]> {
    return this.surveyRepo.find({ where: { tenant_id: tenantId } });
  }

  async findSurveyById(tenantId: string, id: string): Promise<EngagementSurvey> {
    const survey = await this.surveyRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!survey) throw new NotFoundException(`Survey ${id} not found`);
    return survey;
  }

  async updateSurvey(tenantId: string, id: string, dto: UpdateSurveyDto): Promise<EngagementSurvey> {
    const survey = await this.findSurveyById(tenantId, id);
    Object.assign(survey, dto);
    return this.surveyRepo.save(survey);
  }

  async deleteSurvey(tenantId: string, id: string): Promise<void> {
    const survey = await this.findSurveyById(tenantId, id);
    await this.surveyRepo.softRemove(survey);
  }

  async addQuestion(tenantId: string, dto: CreateSurveyQuestionDto): Promise<SurveyQuestion> {
    const question = this.questionRepo.create({ tenant_id: tenantId, ...dto });
    return this.questionRepo.save(question);
  }

  async getSurveyQuestions(tenantId: string, surveyId: string): Promise<SurveyQuestion[]> {
    return this.questionRepo.find({
      where: { tenant_id: tenantId, survey_id: surveyId },
      order: { position: 'ASC' },
    });
  }

  async submitResponse(tenantId: string, dto: SubmitSurveyResponseDto): Promise<SurveyResponse> {
    const existing = await this.responseRepo.findOne({
      where: {
        tenant_id: tenantId,
        survey_id: dto.survey_id,
        employee_id: dto.employee_id,
        question_id: dto.question_id,
      },
    });
    if (existing) throw new ConflictException('Response already submitted for this question');
    const response = this.responseRepo.create({ tenant_id: tenantId, ...dto });
    return this.responseRepo.save(response);
  }

  async getParticipation(tenantId: string, surveyId: string): Promise<SurveyParticipation[]> {
    return this.participationRepo.find({
      where: { tenant_id: tenantId, survey_id: surveyId },
    });
  }
}
