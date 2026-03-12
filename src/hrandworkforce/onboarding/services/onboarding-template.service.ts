import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingTemplate } from '../entities/onboarding-template.entity';
import { OnboardingTemplateTask } from '../entities/onboarding-template-task.entity';
import { OffboardingTemplate } from '../entities/offboarding-template.entity';
import { OffboardingTemplateTask } from '../entities/offboarding-template-task.entity';
import {
  CreateOnboardingTemplateDto,
  UpdateOnboardingTemplateDto,
  CreateOnboardingTemplateTaskDto,
  CreateOffboardingTemplateDto,
  UpdateOffboardingTemplateDto,
  CreateOffboardingTemplateTaskDto,
} from '../dto/onboarding.dto';

@Injectable()
export class OnboardingTemplateService {
  constructor(
    @InjectRepository(OnboardingTemplate)
    private readonly onboardingTemplateRepo: Repository<OnboardingTemplate>,
    @InjectRepository(OnboardingTemplateTask)
    private readonly onboardingTemplateTaskRepo: Repository<OnboardingTemplateTask>,
    @InjectRepository(OffboardingTemplate)
    private readonly offboardingTemplateRepo: Repository<OffboardingTemplate>,
    @InjectRepository(OffboardingTemplateTask)
    private readonly offboardingTemplateTaskRepo: Repository<OffboardingTemplateTask>,
  ) {}

  // ─── Onboarding Templates ────────────────────────────────────────────────────

  findAllOnboarding(tenantId: string) {
    return this.onboardingTemplateRepo.find({ where: { tenant_id: tenantId } });
  }

  async findOneOnboarding(id: string, tenantId: string) {
    const template = await this.onboardingTemplateRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!template) throw new NotFoundException('Onboarding template not found');
    return template;
  }

  createOnboarding(dto: CreateOnboardingTemplateDto, tenantId: string, userId: string) {
    return this.onboardingTemplateRepo.save(
      this.onboardingTemplateRepo.create({ ...dto, tenant_id: tenantId, created_by: userId }),
    );
  }

  async updateOnboarding(id: string, dto: UpdateOnboardingTemplateDto, tenantId: string) {
    const template = await this.findOneOnboarding(id, tenantId);
    Object.assign(template, dto);
    return this.onboardingTemplateRepo.save(template);
  }

  async removeOnboarding(id: string, tenantId: string) {
    const template = await this.findOneOnboarding(id, tenantId);
    return this.onboardingTemplateRepo.softRemove(template);
  }

  findOnboardingTasks(templateId: string, tenantId: string) {
    return this.onboardingTemplateTaskRepo.find({
      where: { template_id: templateId, tenant_id: tenantId },
      order: { relative_day_offset: 'ASC' },
    });
  }

  createOnboardingTask(templateId: string, dto: CreateOnboardingTemplateTaskDto, tenantId: string) {
    return this.onboardingTemplateTaskRepo.save(
      this.onboardingTemplateTaskRepo.create({ ...dto, template_id: templateId, tenant_id: tenantId }),
    );
  }

  async removeOnboardingTask(taskId: string, tenantId: string) {
    const task = await this.onboardingTemplateTaskRepo.findOne({ where: { id: taskId, tenant_id: tenantId } });
    if (!task) throw new NotFoundException('Task not found');
    return this.onboardingTemplateTaskRepo.remove(task);
  }

  // ─── Offboarding Templates ───────────────────────────────────────────────────

  findAllOffboarding(tenantId: string) {
    return this.offboardingTemplateRepo.find({ where: { tenant_id: tenantId } });
  }

  async findOneOffboarding(id: string, tenantId: string) {
    const template = await this.offboardingTemplateRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!template) throw new NotFoundException('Offboarding template not found');
    return template;
  }

  createOffboarding(dto: CreateOffboardingTemplateDto, tenantId: string, userId: string) {
    return this.offboardingTemplateRepo.save(
      this.offboardingTemplateRepo.create({ ...dto, tenant_id: tenantId, created_by: userId }),
    );
  }

  async updateOffboarding(id: string, dto: UpdateOffboardingTemplateDto, tenantId: string) {
    const template = await this.findOneOffboarding(id, tenantId);
    Object.assign(template, dto);
    return this.offboardingTemplateRepo.save(template);
  }

  async removeOffboarding(id: string, tenantId: string) {
    const template = await this.findOneOffboarding(id, tenantId);
    return this.offboardingTemplateRepo.softRemove(template);
  }

  findOffboardingTasks(templateId: string, tenantId: string) {
    return this.offboardingTemplateTaskRepo.find({
      where: { template_id: templateId, tenant_id: tenantId },
      order: { relative_day_offset: 'ASC' },
    });
  }

  createOffboardingTask(templateId: string, dto: CreateOffboardingTemplateTaskDto, tenantId: string) {
    return this.offboardingTemplateTaskRepo.save(
      this.offboardingTemplateTaskRepo.create({ ...dto, template_id: templateId, tenant_id: tenantId }),
    );
  }

  async removeOffboardingTask(taskId: string, tenantId: string) {
    const task = await this.offboardingTemplateTaskRepo.findOne({ where: { id: taskId, tenant_id: tenantId } });
    if (!task) throw new NotFoundException('Task not found');
    return this.offboardingTemplateTaskRepo.remove(task);
  }
}
