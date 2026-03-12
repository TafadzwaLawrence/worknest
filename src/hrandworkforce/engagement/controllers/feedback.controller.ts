import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FeedbackService } from '../services/feedback.service.js';
import {
  CreateFeedbackChannelDto,
  CreateFeedbackDto,
  CreateFeedbackCommentDto,
  VoteFeedbackDto,
  CreateFeedbackActionDto,
} from '../dto/engagement.dto.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';

@Controller('engagement/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('channels')
  createChannel(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateFeedbackChannelDto,
  ) {
    return this.feedbackService.createChannel(user.tenant_id, dto, user.id);
  }

  @Get('channels')
  findAllChannels(@CurrentUser() user: { tenant_id: string }) {
    return this.feedbackService.findAllChannels(user.tenant_id);
  }

  @Post()
  createFeedback(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.createFeedback(user.tenant_id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { tenant_id: string }) {
    return this.feedbackService.findAllFeedback(user.tenant_id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.feedbackService.findFeedbackById(user.tenant_id, id);
  }

  @Post('comments')
  addComment(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: CreateFeedbackCommentDto,
  ) {
    return this.feedbackService.addComment(user.tenant_id, dto);
  }

  @Post('votes')
  vote(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: VoteFeedbackDto,
  ) {
    return this.feedbackService.voteFeedback(user.tenant_id, dto);
  }

  @Post('actions')
  createAction(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateFeedbackActionDto,
  ) {
    return this.feedbackService.createAction(user.tenant_id, dto, user.id);
  }

  @Get(':id/actions')
  getActions(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) feedbackId: string,
  ) {
    return this.feedbackService.getFeedbackActions(user.tenant_id, feedbackId);
  }
}
