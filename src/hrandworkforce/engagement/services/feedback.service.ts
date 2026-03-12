import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedbackChannel } from '../entities/feedback-channel.entity.js';
import { EmployeeFeedback } from '../entities/employee-feedback.entity.js';
import { FeedbackComment } from '../entities/feedback-comment.entity.js';
import { FeedbackVote } from '../entities/feedback-vote.entity.js';
import { FeedbackAction } from '../entities/feedback-action.entity.js';
import {
  CreateFeedbackChannelDto,
  CreateFeedbackDto,
  CreateFeedbackCommentDto,
  VoteFeedbackDto,
  CreateFeedbackActionDto,
} from '../dto/engagement.dto.js';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(FeedbackChannel)
    private readonly channelRepo: Repository<FeedbackChannel>,
    @InjectRepository(EmployeeFeedback)
    private readonly feedbackRepo: Repository<EmployeeFeedback>,
    @InjectRepository(FeedbackComment)
    private readonly commentRepo: Repository<FeedbackComment>,
    @InjectRepository(FeedbackVote)
    private readonly voteRepo: Repository<FeedbackVote>,
    @InjectRepository(FeedbackAction)
    private readonly actionRepo: Repository<FeedbackAction>,
  ) {}

  async createChannel(tenantId: string, dto: CreateFeedbackChannelDto, userId: string): Promise<FeedbackChannel> {
    const channel = this.channelRepo.create({ tenant_id: tenantId, created_by: userId, ...dto });
    return this.channelRepo.save(channel);
  }

  async findAllChannels(tenantId: string): Promise<FeedbackChannel[]> {
    return this.channelRepo.find({ where: { tenant_id: tenantId, is_active: true } });
  }

  async createFeedback(tenantId: string, dto: CreateFeedbackDto): Promise<EmployeeFeedback> {
    const feedback = this.feedbackRepo.create({ tenant_id: tenantId, ...dto });
    return this.feedbackRepo.save(feedback);
  }

  async findAllFeedback(tenantId: string): Promise<EmployeeFeedback[]> {
    return this.feedbackRepo.find({ where: { tenant_id: tenantId } });
  }

  async findFeedbackById(tenantId: string, id: string): Promise<EmployeeFeedback> {
    const feedback = await this.feedbackRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!feedback) throw new NotFoundException(`Feedback ${id} not found`);
    return feedback;
  }

  async addComment(tenantId: string, dto: CreateFeedbackCommentDto): Promise<FeedbackComment> {
    const comment = this.commentRepo.create({ tenant_id: tenantId, ...dto });
    return this.commentRepo.save(comment);
  }

  async voteFeedback(tenantId: string, dto: VoteFeedbackDto): Promise<FeedbackVote> {
    const existing = await this.voteRepo.findOne({
      where: { tenant_id: tenantId, feedback_id: dto.feedback_id, employee_id: dto.employee_id },
    });
    if (existing) throw new ConflictException('Already voted on this feedback');
    const vote = this.voteRepo.create({ tenant_id: tenantId, ...dto });
    const saved = await this.voteRepo.save(vote);
    const feedback = await this.findFeedbackById(tenantId, dto.feedback_id);
    if (dto.vote_type === 'upvote') feedback.upvotes += 1;
    else feedback.downvotes += 1;
    await this.feedbackRepo.save(feedback);
    return saved;
  }

  async createAction(tenantId: string, dto: CreateFeedbackActionDto, userId: string): Promise<FeedbackAction> {
    const action = this.actionRepo.create({ tenant_id: tenantId, created_by: userId, ...dto });
    return this.actionRepo.save(action);
  }

  async getFeedbackActions(tenantId: string, feedbackId: string): Promise<FeedbackAction[]> {
    return this.actionRepo.find({ where: { tenant_id: tenantId, feedback_id: feedbackId } });
  }
}
