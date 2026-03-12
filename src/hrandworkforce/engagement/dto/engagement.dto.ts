import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsUUID,
  IsObject,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import {
  SurveyType,
  SurveyStatus,
  QuestionType,
  RecognitionType,
  FeedbackVisibility,
  SentimentScore,
} from '../engagement.enums.js';

// ────────────── Survey DTOs ──────────────

export class CreateSurveyDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SurveyType)
  survey_type?: SurveyType;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsBoolean()
  is_anonymous?: boolean;

  @IsOptional()
  @IsBoolean()
  is_confidential?: boolean;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsObject()
  reminder_settings?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  participation_goal?: number;
}

export class UpdateSurveyDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SurveyStatus)
  status?: SurveyStatus;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsObject()
  reminder_settings?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  participation_goal?: number;
}

export class CreateSurveyQuestionDto {
  @IsUUID()
  survey_id: string;

  @IsString()
  question_text: string;

  @IsEnum(QuestionType)
  question_type: QuestionType;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  benchmark_value?: number;
}

export class SubmitSurveyResponseDto {
  @IsUUID()
  survey_id: string;

  @IsUUID()
  employee_id: string;

  @IsUUID()
  question_id: string;

  @IsOptional()
  @IsString()
  response_value?: string;

  @IsOptional()
  @IsNumber()
  numeric_value?: number;

  @IsOptional()
  @IsObject()
  selected_options?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(SentimentScore)
  sentiment?: SentimentScore;

  @IsOptional()
  @IsInt()
  response_time_seconds?: number;
}

// ────────────── Recognition DTOs ──────────────

export class CreateRecognitionProgramDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RecognitionType)
  recognition_type: RecognitionType;

  @IsOptional()
  @IsInt()
  points_value?: number;

  @IsOptional()
  @IsBoolean()
  approval_required?: boolean;

  @IsOptional()
  @IsUUID()
  workflow_id?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export class CreateRecognitionDto {
  @IsOptional()
  @IsUUID()
  program_id?: string;

  @IsUUID()
  receiver_id: string;

  @IsEnum(RecognitionType)
  recognition_type: RecognitionType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(FeedbackVisibility)
  visibility?: FeedbackVisibility;

  @IsOptional()
  @IsBoolean()
  is_anonymous?: boolean;
}

export class CreateRewardsCatalogDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  points_cost: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  inventory_count?: number;

  @IsOptional()
  @IsInt()
  max_per_employee?: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export class RedeemRewardDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  reward_id: string;
}

// ────────────── Feedback DTOs ──────────────

export class CreateFeedbackChannelDto {
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
  moderation_required?: boolean;

  @IsOptional()
  @IsBoolean()
  anonymity_allowed?: boolean;
}

export class CreateFeedbackDto {
  @IsUUID()
  channel_id: string;

  @IsOptional()
  @IsUUID()
  author_id?: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(FeedbackVisibility)
  visibility?: FeedbackVisibility;
}

export class CreateFeedbackCommentDto {
  @IsUUID()
  feedback_id: string;

  @IsOptional()
  @IsUUID()
  author_id?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  is_anonymous?: boolean;
}

export class VoteFeedbackDto {
  @IsUUID()
  feedback_id: string;

  @IsUUID()
  employee_id: string;

  @IsString()
  vote_type: string; // 'upvote' | 'downvote'
}

export class CreateFeedbackActionDto {
  @IsUUID()
  feedback_id: string;

  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @IsString()
  action_text: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;
}

// ────────────── Pulse DTOs ──────────────

export class CreatePulseQuestionDto {
  @IsString()
  question_text: string;

  @IsEnum(QuestionType)
  question_type: QuestionType;

  @IsOptional()
  @IsInt()
  scale_min?: number;

  @IsOptional()
  @IsInt()
  scale_max?: number;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class SubmitPulseResponseDto {
  @IsUUID()
  question_id: string;

  @IsUUID()
  employee_id: string;

  @IsNumber()
  response_value: number;

  @IsOptional()
  @IsEnum(SentimentScore)
  sentiment?: SentimentScore;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsDateString()
  response_date: string;
}

export class TrackMoodDto {
  @IsUUID()
  employee_id: string;

  @IsInt()
  @Min(1)
  @Max(5)
  mood_score: number;

  @IsOptional()
  @IsString()
  mood_emoji?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  factors?: Record<string, unknown>;

  @IsDateString()
  track_date: string;
}
