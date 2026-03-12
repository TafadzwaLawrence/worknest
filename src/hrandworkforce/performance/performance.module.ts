import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { ReviewCycle } from './entities/review-cycle.entity.js';
import { ReviewTemplate } from './entities/review-template.entity.js';
import { PerformanceReview } from './entities/performance-review.entity.js';
import { ReviewParticipant } from './entities/review-participant.entity.js';
import { ReviewResponse } from './entities/review-response.entity.js';
import { GoalTemplate } from './entities/goal-template.entity.js';
import { Goal } from './entities/goal.entity.js';
import { GoalAlignment } from './entities/goal-alignment.entity.js';
import { GoalUpdate } from './entities/goal-update.entity.js';
import { CompetencyFramework } from './entities/competency-framework.entity.js';
import { Competency } from './entities/competency.entity.js';
import { EmployeeCompetency } from './entities/employee-competency.entity.js';
import { Skill } from './entities/skill.entity.js';
import { EmployeeSkill } from './entities/employee-skill.entity.js';
import { Course } from './entities/course.entity.js';
import { CourseModule } from './entities/course-module.entity.js';
import { CourseContent } from './entities/course-content.entity.js';
import { CourseEnrollment } from './entities/course-enrollment.entity.js';
import { LearningPath } from './entities/learning-path.entity.js';
import { TrainingRequest } from './entities/training-request.entity.js';
import { DevelopmentPlan } from './entities/development-plan.entity.js';
import { DevelopmentPlanItem } from './entities/development-plan-item.entity.js';

// Services
import { ReviewService } from './services/review.service.js';
import { GoalService } from './services/goal.service.js';
import { CompetencyService } from './services/competency.service.js';
import { LearningService } from './services/learning.service.js';
import { DevelopmentService } from './services/development.service.js';

// Controllers
import { ReviewController } from './controllers/review.controller.js';
import { GoalController } from './controllers/goal.controller.js';
import { CompetencyController } from './controllers/competency.controller.js';
import { LearningController } from './controllers/learning.controller.js';
import { DevelopmentController } from './controllers/development.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReviewCycle,
      ReviewTemplate,
      PerformanceReview,
      ReviewParticipant,
      ReviewResponse,
      GoalTemplate,
      Goal,
      GoalAlignment,
      GoalUpdate,
      CompetencyFramework,
      Competency,
      EmployeeCompetency,
      Skill,
      EmployeeSkill,
      Course,
      CourseModule,
      CourseContent,
      CourseEnrollment,
      LearningPath,
      TrainingRequest,
      DevelopmentPlan,
      DevelopmentPlanItem,
    ]),
  ],
  controllers: [
    ReviewController,
    GoalController,
    CompetencyController,
    LearningController,
    DevelopmentController,
  ],
  providers: [
    ReviewService,
    GoalService,
    CompetencyService,
    LearningService,
    DevelopmentService,
  ],
})
export class PerformanceModule {}

