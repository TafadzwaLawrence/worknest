import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { EngagementSurvey } from './entities/engagement-survey.entity.js';
import { SurveyQuestion } from './entities/survey-question.entity.js';
import { SurveyResponse } from './entities/survey-response.entity.js';
import { SurveyParticipation } from './entities/survey-participation.entity.js';
import { RecognitionProgram } from './entities/recognition-program.entity.js';
import { Recognition } from './entities/recognition.entity.js';
import { RecognitionTag } from './entities/recognition-tag.entity.js';
import { EmployeePoints } from './entities/employee-points.entity.js';
import { RewardsCatalog } from './entities/rewards-catalog.entity.js';
import { RewardRedemption } from './entities/reward-redemption.entity.js';
import { FeedbackChannel } from './entities/feedback-channel.entity.js';
import { EmployeeFeedback } from './entities/employee-feedback.entity.js';
import { FeedbackComment } from './entities/feedback-comment.entity.js';
import { FeedbackVote } from './entities/feedback-vote.entity.js';
import { FeedbackAction } from './entities/feedback-action.entity.js';
import { PulseQuestion } from './entities/pulse-question.entity.js';
import { PulseResponse } from './entities/pulse-response.entity.js';
import { MoodTracking } from './entities/mood-tracking.entity.js';
import { EngagementScore } from './entities/engagement-score.entity.js';
import { TeamEngagementMetric } from './entities/team-engagement-metric.entity.js';
import { EngagementTrend } from './entities/engagement-trend.entity.js';

// Services
import { SurveyService } from './services/survey.service.js';
import { RecognitionService } from './services/recognition.service.js';
import { FeedbackService } from './services/feedback.service.js';
import { PulseAnalyticsService } from './services/pulse-analytics.service.js';

// Controllers
import { SurveyController } from './controllers/survey.controller.js';
import { RecognitionController } from './controllers/recognition.controller.js';
import { FeedbackController } from './controllers/feedback.controller.js';
import { PulseAnalyticsController } from './controllers/pulse-analytics.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EngagementSurvey,
      SurveyQuestion,
      SurveyResponse,
      SurveyParticipation,
      RecognitionProgram,
      Recognition,
      RecognitionTag,
      EmployeePoints,
      RewardsCatalog,
      RewardRedemption,
      FeedbackChannel,
      EmployeeFeedback,
      FeedbackComment,
      FeedbackVote,
      FeedbackAction,
      PulseQuestion,
      PulseResponse,
      MoodTracking,
      EngagementScore,
      TeamEngagementMetric,
      EngagementTrend,
    ]),
  ],
  controllers: [
    SurveyController,
    RecognitionController,
    FeedbackController,
    PulseAnalyticsController,
  ],
  providers: [
    SurveyService,
    RecognitionService,
    FeedbackService,
    PulseAnalyticsService,
  ],
})
export class EngagementModule {}

