import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
  IsNumber,
  IsUUID,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import {
  ReviewType,
  ReviewStatus,
  RatingScale,
  GoalType,
  GoalPeriod,
  GoalStatus,
  CompetencyLevel,
  CourseStatus,
  EnrollmentStatus,
  ContentType,
} from '../performance.enums.js';

// ─── Review Cycle ───────────────────────────────────────────────────────────

export class CreateReviewCycleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ReviewType)
  review_type: ReviewType;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  auto_reminder?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  reminder_days_before?: number[];
}

export class UpdateReviewCycleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ReviewType)
  review_type?: ReviewType;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  auto_reminder?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  reminder_days_before?: number[];
}

// ─── Review Template ─────────────────────────────────────────────────────────

export class CreateReviewTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ReviewType)
  review_type: ReviewType;

  @IsOptional()
  @IsEnum(RatingScale)
  rating_scale?: RatingScale;

  @IsArray()
  questions: Record<string, unknown>[];

  @IsOptional()
  weightings?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateReviewTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ReviewType)
  review_type?: ReviewType;

  @IsOptional()
  @IsEnum(RatingScale)
  rating_scale?: RatingScale;

  @IsOptional()
  @IsArray()
  questions?: Record<string, unknown>[];

  @IsOptional()
  weightings?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── Performance Review ───────────────────────────────────────────────────────

export class CreatePerformanceReviewDto {
  @IsUUID()
  employee_id: string;

  @IsOptional()
  @IsUUID()
  reviewer_id?: string;

  @IsOptional()
  @IsUUID()
  review_cycle_id?: string;

  @IsOptional()
  @IsUUID()
  template_id?: string;

  @IsEnum(ReviewType)
  review_type: ReviewType;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsBoolean()
  is_self_review?: boolean;

  @IsOptional()
  @IsBoolean()
  is_anonymous?: boolean;
}

export class UpdatePerformanceReviewDto {
  @IsOptional()
  @IsUUID()
  reviewer_id?: string;

  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @IsOptional()
  @IsNumber()
  overall_rating?: number;

  @IsOptional()
  @IsString()
  overall_comments?: string;

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  development_areas?: string;

  @IsOptional()
  recommendations?: Record<string, unknown>;
}

// ─── Review Participant ───────────────────────────────────────────────────────

export class CreateReviewParticipantDto {
  @IsUUID()
  review_id: string;

  @IsUUID()
  participant_id: string;

  @IsString()
  relationship_type: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;
}

export class UpdateReviewParticipantDto {
  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @IsOptional()
  @IsBoolean()
  is_completed?: boolean;
}

// ─── Review Response ──────────────────────────────────────────────────────────

export class CreateReviewResponseDto {
  @IsUUID()
  review_id: string;

  @IsUUID()
  participant_id: string;

  @IsString()
  question_id: string;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  evidence?: Record<string, unknown>;
}

export class UpdateReviewResponseDto {
  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  evidence?: Record<string, unknown>;
}

// ─── Goal Template ────────────────────────────────────────────────────────────

export class CreateGoalTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(GoalType)
  goal_type: GoalType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  default_metrics?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateGoalTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(GoalType)
  goal_type?: GoalType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  default_metrics?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── Goal ─────────────────────────────────────────────────────────────────────

export class CreateGoalDto {
  @IsUUID()
  employee_id: string;

  @IsOptional()
  @IsUUID()
  parent_goal_id?: string;

  @IsOptional()
  @IsUUID()
  template_id?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(GoalType)
  goal_type?: GoalType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsEnum(GoalPeriod)
  period: GoalPeriod;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsNumber()
  target_value?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsBoolean()
  is_private?: boolean;

  @IsOptional()
  @IsArray()
  key_results?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  milestones?: Record<string, unknown>[];
}

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @IsOptional()
  @IsNumber()
  current_value?: number;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsArray()
  key_results?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  milestones?: Record<string, unknown>[];
}

// ─── Goal Alignment ───────────────────────────────────────────────────────────

export class CreateGoalAlignmentDto {
  @IsUUID()
  goal_id: string;

  @IsUUID()
  aligned_goal_id: string;

  @IsOptional()
  @IsNumber()
  alignment_strength?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

// ─── Goal Update ──────────────────────────────────────────────────────────────

export class CreateGoalUpdateDto {
  @IsUUID()
  goal_id: string;

  @IsNumber()
  new_value: number;

  @IsOptional()
  @IsDateString()
  update_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  evidence_url?: string;
}

// ─── Competency Framework ─────────────────────────────────────────────────────

export class CreateCompetencyFrameworkDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateCompetencyFrameworkDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── Competency ───────────────────────────────────────────────────────────────

export class CreateCompetencyDto {
  @IsUUID()
  framework_id: string;

  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  behavioral_indicators?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  is_core?: boolean;

  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class UpdateCompetencyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  behavioral_indicators?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  is_core?: boolean;

  @IsOptional()
  @IsNumber()
  weight?: number;
}

// ─── Employee Competency ──────────────────────────────────────────────────────

export class CreateEmployeeCompetencyDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  competency_id: string;

  @IsOptional()
  @IsEnum(CompetencyLevel)
  current_level?: CompetencyLevel;

  @IsOptional()
  @IsEnum(CompetencyLevel)
  target_level?: CompetencyLevel;

  @IsOptional()
  @IsNumber()
  confidence_level?: number;

  @IsOptional()
  @IsDateString()
  assessed_date?: string;

  @IsOptional()
  @IsDateString()
  next_review_date?: string;

  @IsOptional()
  @IsUUID()
  assessed_by?: string;

  @IsOptional()
  evidence?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEmployeeCompetencyDto {
  @IsOptional()
  @IsEnum(CompetencyLevel)
  current_level?: CompetencyLevel;

  @IsOptional()
  @IsEnum(CompetencyLevel)
  target_level?: CompetencyLevel;

  @IsOptional()
  @IsNumber()
  confidence_level?: number;

  @IsOptional()
  evidence?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── Skill ────────────────────────────────────────────────────────────────────

export class CreateSkillDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  is_technical?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateSkillDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  is_technical?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── Employee Skill ───────────────────────────────────────────────────────────

export class CreateEmployeeSkillDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  skill_id: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  proficiency_level: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  interest_level?: number;

  @IsOptional()
  @IsNumber()
  years_experience?: number;

  @IsOptional()
  @IsBoolean()
  is_certified?: boolean;

  @IsOptional()
  @IsDateString()
  certification_date?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEmployeeSkillDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  proficiency_level?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  interest_level?: number;

  @IsOptional()
  @IsNumber()
  years_experience?: number;

  @IsOptional()
  @IsBoolean()
  is_certified?: boolean;

  @IsOptional()
  @IsDateString()
  certification_date?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;
}

// ─── Course ───────────────────────────────────────────────────────────────────

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  duration_hours?: number;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsUUID()
  instructor_id?: string;

  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @IsOptional()
  prerequisites?: Record<string, unknown>;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  is_mandatory?: boolean;

  @IsOptional()
  @IsNumber()
  passing_score?: number;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsBoolean()
  is_mandatory?: boolean;
}

// ─── Course Module ────────────────────────────────────────────────────────────

export class CreateCourseModuleDto {
  @IsUUID()
  course_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;
}

export class UpdateCourseModuleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;
}

// ─── Course Content ───────────────────────────────────────────────────────────

export class CreateCourseContentDto {
  @IsUUID()
  module_id: string;

  @IsString()
  title: string;

  @IsEnum(ContentType)
  type: ContentType;

  content: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @IsOptional()
  @IsBoolean()
  is_mandatory?: boolean;
}

export class UpdateCourseContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @IsOptional()
  content?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  order_index?: number;
}

// ─── Course Enrollment ────────────────────────────────────────────────────────

export class CreateCourseEnrollmentDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  course_id: string;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}

export class UpdateCourseEnrollmentDto {
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @IsOptional()
  @IsNumber()
  completion_percentage?: number;

  @IsOptional()
  @IsNumber()
  score?: number;
}

// ─── Learning Path ────────────────────────────────────────────────────────────

export class CreateLearningPathDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  courses?: string[];

  @IsOptional()
  @IsNumber()
  estimated_hours?: number;

  @IsOptional()
  @IsUUID()
  target_designation_id?: string;

  @IsOptional()
  @IsString()
  target_role?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateLearningPathDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  courses?: string[];

  @IsOptional()
  @IsNumber()
  estimated_hours?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── Training Request ─────────────────────────────────────────────────────────

export class CreateTrainingRequestDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  course_url?: string;

  @IsOptional()
  @IsNumber()
  estimated_cost?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  preferred_start_date?: string;

  @IsOptional()
  @IsNumber()
  duration_days?: number;
}

export class UpdateTrainingRequestDto {
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  rejection_reason?: string;
}

// ─── Development Plan ─────────────────────────────────────────────────────────

export class CreateDevelopmentPlanDto {
  @IsUUID()
  employee_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsString()
  career_goal?: string;
}

export class UpdateDevelopmentPlanDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(['draft', 'active', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  career_goal?: string;
}

// ─── Development Plan Item ────────────────────────────────────────────────────

export class CreateDevelopmentPlanItemDto {
  @IsUUID()
  plan_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['training', 'mentoring', 'project', 'shadowing', 'reading', 'certification', 'other'])
  type: string;

  @IsOptional()
  @IsUUID()
  course_id?: string;

  @IsOptional()
  @IsString()
  resource_url?: string;

  @IsOptional()
  @IsDateString()
  target_date?: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;
}

export class UpdateDevelopmentPlanItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(['pending', 'in_progress', 'completed', 'skipped'])
  status?: string;

  @IsOptional()
  @IsDateString()
  target_date?: string;

  @IsOptional()
  @IsDateString()
  completed_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
