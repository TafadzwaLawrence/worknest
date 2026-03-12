import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Application } from '../entities/application.entity.js';
import { Pipeline } from '../entities/pipeline.entity.js';
import { PipelineStage } from '../entities/pipeline-stage.entity.js';
import { CreateApplicationDto, UpdateApplicationStatusDto } from '../dto/application.dto.js';
import { CreatePipelineDto, CreatePipelineStageDto } from '../dto/misc.dto.js';
import { PaginationDto } from '../../core/dto/pagination.dto.js';
import { ApplicationStatus } from '../entities/recruitment.enums.js';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(Pipeline)
    private readonly pipelineRepo: Repository<Pipeline>,
    @InjectRepository(PipelineStage)
    private readonly stageRepo: Repository<PipelineStage>,
  ) {}

  // ─── Applications ────────────────────────────────────────────────

  async findAll(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.appRepo.findAndCount({
      where: { tenant_id: tenantId, deleted_at: IsNull() },
      order: { applied_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Application> {
    const app = await this.appRepo.findOne({
      where: { id, tenant_id: tenantId, deleted_at: IsNull() },
      relations: ['applicant', 'jobPosting', 'stage'],
    });
    if (!app) throw new NotFoundException(`Application ${id} not found`);
    return app;
  }

  async create(dto: CreateApplicationDto, tenantId: string, userId: string): Promise<Application> {
    return this.appRepo.save(
      this.appRepo.create({ ...dto, tenant_id: tenantId, created_by: userId }),
    );
  }

  async updateStatus(id: string, dto: UpdateApplicationStatusDto, tenantId: string, userId: string): Promise<Application> {
    const app = await this.findOne(id, tenantId);
    app.status = dto.status as ApplicationStatus;
    if (dto.stage_id) app.stage_id = dto.stage_id;
    app.updated_by = userId;
    return this.appRepo.save(app);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const app = await this.findOne(id, tenantId);
    await this.appRepo.softRemove(app);
  }

  // ─── Pipelines ───────────────────────────────────────────────────

  async findAllPipelines(tenantId: string): Promise<Pipeline[]> {
    return this.pipelineRepo.find({ where: { tenant_id: tenantId }, order: { created_at: 'ASC' } });
  }

  async findOnePipeline(id: string, tenantId: string): Promise<Pipeline> {
    const pipeline = await this.pipelineRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!pipeline) throw new NotFoundException(`Pipeline ${id} not found`);
    return pipeline;
  }

  async createPipeline(dto: CreatePipelineDto, tenantId: string, userId: string): Promise<Pipeline> {
    const exists = await this.pipelineRepo.findOne({ where: { tenant_id: tenantId, name: dto.name } });
    if (exists) throw new ConflictException(`Pipeline '${dto.name}' already exists`);
    return this.pipelineRepo.save(
      this.pipelineRepo.create({ ...dto, tenant_id: tenantId, created_by: userId }),
    );
  }

  async getPipelineStages(pipelineId: string, tenantId: string): Promise<PipelineStage[]> {
    await this.findOnePipeline(pipelineId, tenantId);
    return this.stageRepo.find({
      where: { pipeline_id: pipelineId, tenant_id: tenantId },
      order: { position: 'ASC' },
    });
  }

  async addStage(pipelineId: string, dto: CreatePipelineStageDto, tenantId: string): Promise<PipelineStage> {
    await this.findOnePipeline(pipelineId, tenantId);
    return this.stageRepo.save(
      this.stageRepo.create({ ...dto, pipeline_id: pipelineId, tenant_id: tenantId }),
    );
  }
}
