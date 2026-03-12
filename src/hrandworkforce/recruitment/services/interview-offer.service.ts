import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from '../entities/interview.entity.js';
import { Interviewer } from '../entities/interviewer.entity.js';
import { Offer } from '../entities/offer.entity.js';
import { Evaluation } from '../entities/evaluation.entity.js';
import { Note } from '../entities/note.entity.js';
import { Tag } from '../entities/tag.entity.js';
import { TaggedItem } from '../entities/tagged-item.entity.js';
import {
  CreateInterviewDto,
  UpdateInterviewDto,
  AddInterviewerDto,
} from '../dto/interview.dto.js';
import { CreateOfferDto, UpdateOfferStatusDto } from '../dto/offer.dto.js';
import { CreateNoteDto, CreateTagDto, CreateEvaluationDto } from '../dto/misc.dto.js';
import { PaginationDto } from '../../core/dto/pagination.dto.js';
import { InterviewStatus, OfferStatus } from '../entities/recruitment.enums.js';

@Injectable()
export class InterviewOfferService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
    @InjectRepository(Interviewer)
    private readonly interviewerRepo: Repository<Interviewer>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Evaluation)
    private readonly evalRepo: Repository<Evaluation>,
    @InjectRepository(Note)
    private readonly noteRepo: Repository<Note>,
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(TaggedItem)
    private readonly taggedItemRepo: Repository<TaggedItem>,
  ) {}

  // ─── Interviews ──────────────────────────────────────────────────

  async findAllInterviews(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.interviewRepo.findAndCount({
      where: { tenant_id: tenantId },
      order: { start_at: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOneInterview(id: string, tenantId: string): Promise<Interview> {
    const interview = await this.interviewRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['application'],
    });
    if (!interview) throw new NotFoundException(`Interview ${id} not found`);
    return interview;
  }

  async createInterview(dto: CreateInterviewDto, tenantId: string, userId: string): Promise<Interview> {
    return this.interviewRepo.save(
      this.interviewRepo.create({
        ...dto,
        tenant_id: tenantId,
        scheduled_by: userId,
        start_at: new Date(dto.start_at),
        end_at: new Date(dto.end_at),
      }),
    );
  }

  async updateInterview(id: string, dto: UpdateInterviewDto, tenantId: string): Promise<Interview> {
    const interview = await this.findOneInterview(id, tenantId);
    Object.assign(interview, {
      ...dto,
      start_at: dto.start_at ? new Date(dto.start_at) : interview.start_at,
      end_at: dto.end_at ? new Date(dto.end_at) : interview.end_at,
    });
    if (dto.status === InterviewStatus.CANCELLED && !interview.cancelled_reason) {
      interview.cancelled_reason = dto.cancelled_reason ?? null;
    }
    return this.interviewRepo.save(interview);
  }

  async addInterviewer(interviewId: string, dto: AddInterviewerDto, tenantId: string): Promise<Interviewer> {
    await this.findOneInterview(interviewId, tenantId);
    const entity = this.interviewerRepo.create({
      interview_id: interviewId,
      user_id: dto.user_id,
      tenant_id: tenantId,
      role: dto.role,
      is_primary: dto.is_primary ?? false,
    });
    return this.interviewerRepo.save(entity);
  }

  async getInterviewers(interviewId: string, tenantId: string): Promise<Interviewer[]> {
    return this.interviewerRepo.find({ where: { interview_id: interviewId, tenant_id: tenantId } });
  }

  // ─── Offers ──────────────────────────────────────────────────────

  async findAllOffers(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.offerRepo.findAndCount({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOneOffer(id: string, tenantId: string): Promise<Offer> {
    const offer = await this.offerRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!offer) throw new NotFoundException(`Offer ${id} not found`);
    return offer;
  }

  async createOffer(dto: CreateOfferDto, tenantId: string, userId: string): Promise<Offer> {
    return this.offerRepo.save(
      this.offerRepo.create({ ...dto, tenant_id: tenantId, offered_by: userId }),
    );
  }

  async updateOfferStatus(id: string, dto: UpdateOfferStatusDto, tenantId: string): Promise<Offer> {
    const offer = await this.findOneOffer(id, tenantId);
    offer.status = dto.status;
    const now = new Date();
    if (dto.status === OfferStatus.ACCEPTED) offer.accepted_at = now;
    else if (dto.status === OfferStatus.DECLINED) offer.declined_at = now;
    else if (dto.status === OfferStatus.WITHDRAWN) offer.withdrawn_at = now;
    else if (dto.status === OfferStatus.ISSUED) offer.issued_at = now;
    return this.offerRepo.save(offer);
  }

  // ─── Evaluations ─────────────────────────────────────────────────

  async createEvaluation(dto: CreateEvaluationDto, tenantId: string, userId: string): Promise<Evaluation> {
    return this.evalRepo.save(
      this.evalRepo.create({ ...dto, tenant_id: tenantId, evaluator_id: userId }),
    );
  }

  async findEvaluations(applicationId: string, tenantId: string): Promise<Evaluation[]> {
    return this.evalRepo.find({ where: { application_id: applicationId, tenant_id: tenantId } });
  }

  // ─── Notes ───────────────────────────────────────────────────────

  async createNote(dto: CreateNoteDto, tenantId: string, userId: string): Promise<Note> {
    return this.noteRepo.save(
      this.noteRepo.create({ ...dto, tenant_id: tenantId, created_by: userId }),
    );
  }

  async findNotes(parentType: string, parentId: string, tenantId: string): Promise<Note[]> {
    return this.noteRepo.find({
      where: { parent_type: parentType, parent_id: parentId, tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  // ─── Tags ─────────────────────────────────────────────────────────

  async findAllTags(tenantId: string): Promise<Tag[]> {
    return this.tagRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async createTag(dto: CreateTagDto, tenantId: string): Promise<Tag> {
    return this.tagRepo.save(this.tagRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async tagItem(tagId: string, itemType: string, itemId: string, tenantId: string, userId: string): Promise<TaggedItem> {
    const existing = await this.taggedItemRepo.findOne({
      where: { tag_id: tagId, item_type: itemType, item_id: itemId, tenant_id: tenantId },
    });
    if (existing) return existing;
    return this.taggedItemRepo.save(
      this.taggedItemRepo.create({ tag_id: tagId, item_type: itemType, item_id: itemId, tenant_id: tenantId, created_by: userId }),
    );
  }

  async untagItem(tagId: string, itemType: string, itemId: string, tenantId: string): Promise<void> {
    await this.taggedItemRepo.delete({ tag_id: tagId, item_type: itemType, item_id: itemId, tenant_id: tenantId });
  }
}
