import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PulseAnalyticsService } from '../services/pulse-analytics.service.js';
import {
  CreatePulseQuestionDto,
  SubmitPulseResponseDto,
  TrackMoodDto,
} from '../dto/engagement.dto.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';

@Controller('engagement/pulse')
export class PulseAnalyticsController {
  constructor(private readonly pulseAnalyticsService: PulseAnalyticsService) {}

  @Post('questions')
  createQuestion(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreatePulseQuestionDto,
  ) {
    return this.pulseAnalyticsService.createPulseQuestion(user.tenant_id, dto, user.id);
  }

  @Get('questions')
  findAllQuestions(@CurrentUser() user: { tenant_id: string }) {
    return this.pulseAnalyticsService.findAllPulseQuestions(user.tenant_id);
  }

  @Post('responses')
  submitResponse(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: SubmitPulseResponseDto,
  ) {
    return this.pulseAnalyticsService.submitPulseResponse(user.tenant_id, dto);
  }

  @Post('mood')
  trackMood(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: TrackMoodDto,
  ) {
    return this.pulseAnalyticsService.trackMood(user.tenant_id, dto);
  }

  @Get('mood/:employeeId')
  getMoodHistory(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.pulseAnalyticsService.getMoodHistory(user.tenant_id, employeeId);
  }

  @Get('scores/:employeeId')
  getEngagementScore(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.pulseAnalyticsService.getEngagementScore(user.tenant_id, employeeId);
  }

  @Get('team-metrics')
  getTeamMetrics(@CurrentUser() user: { tenant_id: string }) {
    return this.pulseAnalyticsService.getTeamMetrics(user.tenant_id);
  }

  @Get('trends')
  getTrends(@CurrentUser() user: { tenant_id: string }) {
    return this.pulseAnalyticsService.getEngagementTrends(user.tenant_id);
  }
}
