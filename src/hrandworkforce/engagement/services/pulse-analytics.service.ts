import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PulseQuestion } from '../entities/pulse-question.entity.js';
import { PulseResponse } from '../entities/pulse-response.entity.js';
import { MoodTracking } from '../entities/mood-tracking.entity.js';
import { EngagementScore } from '../entities/engagement-score.entity.js';
import { TeamEngagementMetric } from '../entities/team-engagement-metric.entity.js';
import { EngagementTrend } from '../entities/engagement-trend.entity.js';
import {
  CreatePulseQuestionDto,
  SubmitPulseResponseDto,
  TrackMoodDto,
} from '../dto/engagement.dto.js';

@Injectable()
export class PulseAnalyticsService {
  constructor(
    @InjectRepository(PulseQuestion)
    private readonly questionRepo: Repository<PulseQuestion>,
    @InjectRepository(PulseResponse)
    private readonly responseRepo: Repository<PulseResponse>,
    @InjectRepository(MoodTracking)
    private readonly moodRepo: Repository<MoodTracking>,
    @InjectRepository(EngagementScore)
    private readonly scoreRepo: Repository<EngagementScore>,
    @InjectRepository(TeamEngagementMetric)
    private readonly metricRepo: Repository<TeamEngagementMetric>,
    @InjectRepository(EngagementTrend)
    private readonly trendRepo: Repository<EngagementTrend>,
  ) {}

  async createPulseQuestion(tenantId: string, dto: CreatePulseQuestionDto, userId: string): Promise<PulseQuestion> {
    const question = this.questionRepo.create({ tenant_id: tenantId, created_by: userId, ...dto });
    return this.questionRepo.save(question);
  }

  async findAllPulseQuestions(tenantId: string): Promise<PulseQuestion[]> {
    return this.questionRepo.find({ where: { tenant_id: tenantId, is_active: true } });
  }

  async submitPulseResponse(tenantId: string, dto: SubmitPulseResponseDto): Promise<PulseResponse> {
    const existing = await this.responseRepo.findOne({
      where: {
        tenant_id: tenantId,
        question_id: dto.question_id,
        employee_id: dto.employee_id,
        response_date: dto.response_date,
      },
    });
    if (existing) throw new ConflictException('Pulse response already submitted for this date');
    const response = this.responseRepo.create({ tenant_id: tenantId, ...dto });
    return this.responseRepo.save(response);
  }

  async trackMood(tenantId: string, dto: TrackMoodDto): Promise<MoodTracking> {
    const existing = await this.moodRepo.findOne({
      where: { tenant_id: tenantId, employee_id: dto.employee_id, track_date: dto.track_date },
    });
    if (existing) {
      Object.assign(existing, dto);
      return this.moodRepo.save(existing);
    }
    const mood = this.moodRepo.create({ tenant_id: tenantId, ...dto });
    return this.moodRepo.save(mood);
  }

  async getMoodHistory(tenantId: string, employeeId: string): Promise<MoodTracking[]> {
    return this.moodRepo.find({
      where: { tenant_id: tenantId, employee_id: employeeId },
      order: { track_date: 'DESC' },
    });
  }

  async getEngagementScore(tenantId: string, employeeId: string): Promise<EngagementScore | null> {
    return this.scoreRepo.findOne({
      where: { tenant_id: tenantId, employee_id: employeeId },
      order: { calculation_date: 'DESC' },
    });
  }

  async getTeamMetrics(tenantId: string): Promise<TeamEngagementMetric[]> {
    return this.metricRepo.find({ where: { tenant_id: tenantId }, order: { metric_date: 'DESC' } });
  }

  async getEngagementTrends(tenantId: string): Promise<EngagementTrend[]> {
    return this.trendRepo.find({ where: { tenant_id: tenantId }, order: { period_start: 'DESC' } });
  }
}
