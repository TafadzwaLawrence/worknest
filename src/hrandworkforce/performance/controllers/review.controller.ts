import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewService } from '../services/review.service.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import {
  CreateReviewCycleDto,
  UpdateReviewCycleDto,
  CreateReviewTemplateDto,
  UpdateReviewTemplateDto,
  CreatePerformanceReviewDto,
  UpdatePerformanceReviewDto,
  CreateReviewParticipantDto,
  UpdateReviewParticipantDto,
  CreateReviewResponseDto,
  UpdateReviewResponseDto,
} from '../dto/performance.dto.js';

@Controller('performance/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // ─── Review Cycles ──────────────────────────────────────────────────────────

  @Post('cycles')
  createCycle(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateReviewCycleDto,
  ) {
    return this.reviewService.createCycle(user.tenant_id, dto, user.id);
  }

  @Get('cycles')
  findAllCycles(@CurrentUser() user: { tenant_id: string }) {
    return this.reviewService.findAllCycles(user.tenant_id);
  }

  @Get('cycles/:id')
  findCycle(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewService.findCycle(user.tenant_id, id);
  }

  @Put('cycles/:id')
  updateCycle(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewCycleDto,
  ) {
    return this.reviewService.updateCycle(user.tenant_id, id, dto);
  }

  @Delete('cycles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCycle(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewService.removeCycle(user.tenant_id, id);
  }

  // ─── Review Templates ───────────────────────────────────────────────────────

  @Post('templates')
  createTemplate(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateReviewTemplateDto,
  ) {
    return this.reviewService.createTemplate(user.tenant_id, dto, user.id);
  }

  @Get('templates')
  findAllTemplates(@CurrentUser() user: { tenant_id: string }) {
    return this.reviewService.findAllTemplates(user.tenant_id);
  }

  @Get('templates/:id')
  findTemplate(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewService.findTemplate(user.tenant_id, id);
  }

  @Put('templates/:id')
  updateTemplate(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewTemplateDto,
  ) {
    return this.reviewService.updateTemplate(user.tenant_id, id, dto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTemplate(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewService.removeTemplate(user.tenant_id, id);
  }

  // ─── Performance Reviews ────────────────────────────────────────────────────

  @Post()
  createReview(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreatePerformanceReviewDto,
  ) {
    return this.reviewService.createReview(user.tenant_id, dto, user.id);
  }

  @Get()
  findAllReviews(@CurrentUser() user: { tenant_id: string }) {
    return this.reviewService.findAllReviews(user.tenant_id);
  }

  @Get(':id')
  findReview(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewService.findReview(user.tenant_id, id);
  }

  @Put(':id')
  updateReview(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePerformanceReviewDto,
  ) {
    return this.reviewService.updateReview(user.tenant_id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeReview(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewService.removeReview(user.tenant_id, id);
  }

  // ─── Participants ───────────────────────────────────────────────────────────

  @Post(':id/participants')
  addParticipant(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Body() dto: CreateReviewParticipantDto,
  ) {
    return this.reviewService.addParticipant(user.tenant_id, { ...dto, review_id: reviewId });
  }

  @Get(':id/participants')
  findParticipants(@Param('id', ParseUUIDPipe) reviewId: string) {
    return this.reviewService.findParticipantsByReview(reviewId);
  }

  @Put('participants/:participantId')
  updateParticipant(
    @Param('participantId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewParticipantDto,
  ) {
    return this.reviewService.updateParticipant(id, dto);
  }

  @Delete('participants/:participantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeParticipant(@Param('participantId', ParseUUIDPipe) id: string) {
    return this.reviewService.removeParticipant(id);
  }

  // ─── Responses ──────────────────────────────────────────────────────────────

  @Post(':id/responses')
  upsertResponse(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Body() dto: CreateReviewResponseDto,
  ) {
    return this.reviewService.upsertResponse(user.tenant_id, { ...dto, review_id: reviewId });
  }

  @Get(':id/responses')
  findResponses(@Param('id', ParseUUIDPipe) reviewId: string) {
    return this.reviewService.findResponsesByReview(reviewId);
  }

  @Put('responses/:responseId')
  updateResponse(
    @Param('responseId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewResponseDto,
  ) {
    return this.reviewService.updateResponse(id, dto);
  }
}
