import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingCase } from '../entities/onboarding-case.entity';
import { OnboardingCaseTask } from '../entities/onboarding-case-task.entity';
import { OnboardingNote } from '../entities/onboarding-note.entity';
import {
  CreateOnboardingCaseDto,
  UpdateOnboardingCaseDto,
  CreateOnboardingCaseTaskDto,
  UpdateOnboardingCaseTaskDto,
  CreateOnboardingNoteDto,
} from '../dto/onboarding.dto';

@Injectable()
export class OnboardingCaseService {
  constructor(
    @InjectRepository(OnboardingCase)
    private readonly caseRepo: Repository<OnboardingCase>,
    @InjectRepository(OnboardingCaseTask)
    private readonly taskRepo: Repository<OnboardingCaseTask>,
    @InjectRepository(OnboardingNote)
    private readonly noteRepo: Repository<OnboardingNote>,
  ) {}

  // ─── Cases ────────────────────────────────────────────────────────────────────

  findAll(tenantId: string) {
    return this.caseRepo.find({ where: { tenant_id: tenantId }, order: { created_at: 'DESC' } });
  }

  async findOne(id: string, tenantId: string) {
    const c = await this.caseRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!c) throw new NotFoundException('Onboarding case not found');
    return c;
  }

  create(dto: CreateOnboardingCaseDto, tenantId: string, userId: string) {
    return this.caseRepo.save(
      this.caseRepo.create({ ...dto, tenant_id: tenantId, created_by: userId, updated_by: userId }),
    );
  }

  async update(id: string, dto: UpdateOnboardingCaseDto, tenantId: string, userId: string) {
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

  createTask(caseId: string, dto: CreateOnboardingCaseTaskDto, tenantId: string) {
    return this.taskRepo.save(
      this.taskRepo.create({ ...dto, case_id: caseId, tenant_id: tenantId }),
    );
  }

  async updateTask(taskId: string, dto: UpdateOnboardingCaseTaskDto, tenantId: string) {
    const t = await this.findOneTask(taskId, tenantId);
    if (dto.status === 'completed' && !t.completed_at) {
      (t as OnboardingCaseTask & { completed_at: Date }).completed_at = new Date();
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

  createNote(caseId: string, dto: CreateOnboardingNoteDto, tenantId: string, userId: string) {
    return this.noteRepo.save(
      this.noteRepo.create({ ...dto, case_id: caseId, tenant_id: tenantId, created_by: userId }),
    );
  }

  async removeNote(noteId: string, tenantId: string) {
    const n = await this.noteRepo.findOne({ where: { id: noteId, tenant_id: tenantId } });
    if (!n) throw new NotFoundException('Note not found');
    return this.noteRepo.remove(n);
  }
}
