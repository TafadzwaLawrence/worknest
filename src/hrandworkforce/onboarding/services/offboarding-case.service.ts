import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OffboardingCase } from '../entities/offboarding-case.entity';
import { OffboardingCaseTask } from '../entities/offboarding-case-task.entity';
import { OffboardingNote } from '../entities/offboarding-note.entity';
import { ExitInterview } from '../entities/exit-interview.entity';
import { KnowledgeTransferRecord } from '../entities/knowledge-transfer-record.entity';
import { ClearanceChecklistItem } from '../entities/clearance-checklist-item.entity';
import {
  CreateOffboardingCaseDto,
  UpdateOffboardingCaseDto,
  CreateOffboardingCaseTaskDto,
  UpdateOffboardingCaseTaskDto,
  CreateOffboardingNoteDto,
  CreateExitInterviewDto,
  UpdateExitInterviewDto,
  CreateKnowledgeTransferDto,
  CreateClearanceItemDto,
  UpdateClearanceItemDto,
} from '../dto/onboarding.dto';

@Injectable()
export class OffboardingCaseService {
  constructor(
    @InjectRepository(OffboardingCase)
    private readonly caseRepo: Repository<OffboardingCase>,
    @InjectRepository(OffboardingCaseTask)
    private readonly taskRepo: Repository<OffboardingCaseTask>,
    @InjectRepository(OffboardingNote)
    private readonly noteRepo: Repository<OffboardingNote>,
    @InjectRepository(ExitInterview)
    private readonly exitInterviewRepo: Repository<ExitInterview>,
    @InjectRepository(KnowledgeTransferRecord)
    private readonly ktRepo: Repository<KnowledgeTransferRecord>,
    @InjectRepository(ClearanceChecklistItem)
    private readonly clearanceRepo: Repository<ClearanceChecklistItem>,
  ) {}

  // ─── Cases ────────────────────────────────────────────────────────────────────

  findAll(tenantId: string) {
    return this.caseRepo.find({ where: { tenant_id: tenantId }, order: { created_at: 'DESC' } });
  }

  async findOne(id: string, tenantId: string) {
    const c = await this.caseRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!c) throw new NotFoundException('Offboarding case not found');
    return c;
  }

  create(dto: CreateOffboardingCaseDto, tenantId: string, userId: string) {
    return this.caseRepo.save(
      this.caseRepo.create({ ...dto, tenant_id: tenantId, created_by: userId, updated_by: userId, initiator_user_id: userId }),
    );
  }

  async update(id: string, dto: UpdateOffboardingCaseDto, tenantId: string, userId: string) {
    const c = await this.findOne(id, tenantId);
    Object.assign(c, { ...dto, updated_by: userId });
    return this.caseRepo.save(c);
  }

  async remove(id: string, tenantId: string) {
    const c = await this.findOne(id, tenantId);
    return this.caseRepo.softRemove(c);
  }

  // ─── Case Tasks ───────────────────────────────────────────────────────────────

  findTasks(caseId: string, tenantId: string) {
    return this.taskRepo.find({ where: { case_id: caseId, tenant_id: tenantId }, order: { due_date: 'ASC' } });
  }

  async findOneTask(taskId: string, tenantId: string) {
    const t = await this.taskRepo.findOne({ where: { id: taskId, tenant_id: tenantId } });
    if (!t) throw new NotFoundException('Task not found');
    return t;
  }

  createTask(caseId: string, dto: CreateOffboardingCaseTaskDto, tenantId: string) {
    return this.taskRepo.save(
      this.taskRepo.create({ ...dto, case_id: caseId, tenant_id: tenantId }),
    );
  }

  async updateTask(taskId: string, dto: UpdateOffboardingCaseTaskDto, tenantId: string) {
    const t = await this.findOneTask(taskId, tenantId);
    if (dto.status === 'completed' && !t.completed_at) {
      (t as OffboardingCaseTask & { completed_at: Date }).completed_at = new Date();
    }
    Object.assign(t, dto);
    return this.taskRepo.save(t);
  }

  async removeTask(taskId: string, tenantId: string) {
    const t = await this.findOneTask(taskId, tenantId);
    return this.taskRepo.softRemove(t);
  }

  // ─── Notes ────────────────────────────────────────────────────────────────────

  findNotes(caseId: string, tenantId: string) {
    return this.noteRepo.find({ where: { case_id: caseId, tenant_id: tenantId }, order: { created_at: 'DESC' } });
  }

  createNote(caseId: string, dto: CreateOffboardingNoteDto, tenantId: string, userId: string) {
    return this.noteRepo.save(
      this.noteRepo.create({ ...dto, case_id: caseId, tenant_id: tenantId, created_by: userId }),
    );
  }

  async removeNote(noteId: string, tenantId: string) {
    const n = await this.noteRepo.findOne({ where: { id: noteId, tenant_id: tenantId } });
    if (!n) throw new NotFoundException('Note not found');
    return this.noteRepo.remove(n);
  }

  // ─── Exit Interviews ─────────────────────────────────────────────────────────

  findExitInterviews(caseId: string, tenantId: string) {
    return this.exitInterviewRepo.find({ where: { offboarding_case_id: caseId, tenant_id: tenantId } });
  }

  createExitInterview(caseId: string, dto: CreateExitInterviewDto, tenantId: string) {
    return this.exitInterviewRepo.save(
      this.exitInterviewRepo.create({ ...dto, offboarding_case_id: caseId, tenant_id: tenantId }),
    );
  }

  async updateExitInterview(interviewId: string, dto: UpdateExitInterviewDto, tenantId: string) {
    const interview = await this.exitInterviewRepo.findOne({ where: { id: interviewId, tenant_id: tenantId } });
    if (!interview) throw new NotFoundException('Exit interview not found');
    Object.assign(interview, dto);
    return this.exitInterviewRepo.save(interview);
  }

  // ─── Knowledge Transfer ──────────────────────────────────────────────────────

  findKnowledgeTransfers(caseId: string, tenantId: string) {
    return this.ktRepo.find({ where: { offboarding_case_id: caseId, tenant_id: tenantId } });
  }

  createKnowledgeTransfer(caseId: string, dto: CreateKnowledgeTransferDto, tenantId: string) {
    return this.ktRepo.save(
      this.ktRepo.create({ ...dto, offboarding_case_id: caseId, tenant_id: tenantId }),
    );
  }

  // ─── Clearance Checklist ─────────────────────────────────────────────────────

  findClearanceItems(caseId: string, tenantId: string) {
    return this.clearanceRepo.find({ where: { offboarding_case_id: caseId, tenant_id: tenantId } });
  }

  createClearanceItem(caseId: string, dto: CreateClearanceItemDto, tenantId: string) {
    return this.clearanceRepo.save(
      this.clearanceRepo.create({ ...dto, offboarding_case_id: caseId, tenant_id: tenantId }),
    );
  }

  async updateClearanceItem(itemId: string, dto: UpdateClearanceItemDto, tenantId: string) {
    const item = await this.clearanceRepo.findOne({ where: { id: itemId, tenant_id: tenantId } });
    if (!item) throw new NotFoundException('Clearance item not found');
    Object.assign(item, dto);
    return this.clearanceRepo.save(item);
  }
}
