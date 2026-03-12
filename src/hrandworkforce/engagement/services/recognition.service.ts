import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecognitionProgram } from '../entities/recognition-program.entity.js';
import { Recognition } from '../entities/recognition.entity.js';
import { RecognitionTag } from '../entities/recognition-tag.entity.js';
import { EmployeePoints } from '../entities/employee-points.entity.js';
import { RewardsCatalog } from '../entities/rewards-catalog.entity.js';
import { RewardRedemption } from '../entities/reward-redemption.entity.js';
import {
  CreateRecognitionProgramDto,
  CreateRecognitionDto,
  CreateRewardsCatalogDto,
  RedeemRewardDto,
} from '../dto/engagement.dto.js';

@Injectable()
export class RecognitionService {
  constructor(
    @InjectRepository(RecognitionProgram)
    private readonly programRepo: Repository<RecognitionProgram>,
    @InjectRepository(Recognition)
    private readonly recognitionRepo: Repository<Recognition>,
    @InjectRepository(RecognitionTag)
    private readonly tagRepo: Repository<RecognitionTag>,
    @InjectRepository(EmployeePoints)
    private readonly pointsRepo: Repository<EmployeePoints>,
    @InjectRepository(RewardsCatalog)
    private readonly catalogRepo: Repository<RewardsCatalog>,
    @InjectRepository(RewardRedemption)
    private readonly redemptionRepo: Repository<RewardRedemption>,
  ) {}

  async createProgram(tenantId: string, dto: CreateRecognitionProgramDto, userId: string): Promise<RecognitionProgram> {
    const program = this.programRepo.create({ tenant_id: tenantId, created_by: userId, ...dto });
    return this.programRepo.save(program);
  }

  async findAllPrograms(tenantId: string): Promise<RecognitionProgram[]> {
    return this.programRepo.find({ where: { tenant_id: tenantId } });
  }

  async createRecognition(tenantId: string, dto: CreateRecognitionDto, giverId: string): Promise<Recognition> {
    const recognition = this.recognitionRepo.create({
      tenant_id: tenantId,
      giver_id: giverId,
      ...dto,
    });
    return this.recognitionRepo.save(recognition);
  }

  async findAllRecognitions(tenantId: string): Promise<Recognition[]> {
    return this.recognitionRepo.find({ where: { tenant_id: tenantId } });
  }

  async findRecognitionById(tenantId: string, id: string): Promise<Recognition> {
    const rec = await this.recognitionRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!rec) throw new NotFoundException(`Recognition ${id} not found`);
    return rec;
  }

  async approveRecognition(tenantId: string, id: string, approvedBy: string): Promise<Recognition> {
    const rec = await this.findRecognitionById(tenantId, id);
    rec.status = 'approved';
    rec.approved_by = approvedBy;
    rec.approved_at = new Date();
    return this.recognitionRepo.save(rec);
  }

  async getEmployeePoints(tenantId: string, employeeId: string): Promise<EmployeePoints> {
    let points = await this.pointsRepo.findOne({ where: { tenant_id: tenantId, employee_id: employeeId } });
    if (!points) {
      points = this.pointsRepo.create({ tenant_id: tenantId, employee_id: employeeId });
      points = await this.pointsRepo.save(points);
    }
    return points;
  }

  async createRewardsCatalog(tenantId: string, dto: CreateRewardsCatalogDto, userId: string): Promise<RewardsCatalog> {
    const reward = this.catalogRepo.create({ tenant_id: tenantId, created_by: userId, ...dto });
    return this.catalogRepo.save(reward);
  }

  async findAllRewards(tenantId: string): Promise<RewardsCatalog[]> {
    return this.catalogRepo.find({ where: { tenant_id: tenantId, is_active: true } });
  }

  async redeemReward(tenantId: string, dto: RedeemRewardDto): Promise<RewardRedemption> {
    const reward = await this.catalogRepo.findOne({ where: { id: dto.reward_id, tenant_id: tenantId } });
    if (!reward) throw new NotFoundException(`Reward ${dto.reward_id} not found`);
    const points = await this.getEmployeePoints(tenantId, dto.employee_id);
    if (points.points_available < reward.points_cost) {
      throw new ConflictException('Insufficient points for this redemption');
    }
    const redemption = this.redemptionRepo.create({
      tenant_id: tenantId,
      employee_id: dto.employee_id,
      reward_id: dto.reward_id,
      points_used: reward.points_cost,
    });
    return this.redemptionRepo.save(redemption);
  }
}
