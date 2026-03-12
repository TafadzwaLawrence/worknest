import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProvisioningRequest } from '../entities/provisioning-request.entity';
import { AssetAssignment } from '../entities/asset-assignment.entity';
import {
  CreateProvisioningRequestDto,
  UpdateProvisioningStatusDto,
  CreateAssetAssignmentDto,
  ReturnAssetDto,
} from '../dto/onboarding.dto';

@Injectable()
export class ProvisioningService {
  constructor(
    @InjectRepository(ProvisioningRequest)
    private readonly provisioningRepo: Repository<ProvisioningRequest>,
    @InjectRepository(AssetAssignment)
    private readonly assetRepo: Repository<AssetAssignment>,
  ) {}

  // ─── Provisioning Requests ───────────────────────────────────────────────────

  findAllByCase(caseType: string, caseId: string, tenantId: string) {
    return this.provisioningRepo.find({
      where: { case_id: caseId, tenant_id: tenantId } as any,
      order: { created_at: 'DESC' },
    });
  }

  findAllForTenant(tenantId: string) {
    return this.provisioningRepo.find({ where: { tenant_id: tenantId }, order: { created_at: 'DESC' } });
  }

  async findOne(id: string, tenantId: string) {
    const req = await this.provisioningRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!req) throw new NotFoundException('Provisioning request not found');
    return req;
  }

  create(dto: CreateProvisioningRequestDto, tenantId: string, userId: string) {
    return this.provisioningRepo.save(
      this.provisioningRepo.create({ ...dto, tenant_id: tenantId, requested_by_user_id: userId }),
    );
  }

  async updateStatus(id: string, dto: UpdateProvisioningStatusDto, tenantId: string, userId: string) {
    const req = await this.findOne(id, tenantId);
    req.status = dto.status as any;
    if (dto.status === 'approved') {
      req.approved_by = userId;
      req.approved_at = new Date();
    } else if (dto.status === 'provisioned') {
      req.provisioned_at = new Date();
    } else if (dto.status === 'revoked') {
      req.revoked_at = new Date();
    }
    return this.provisioningRepo.save(req);
  }

  // ─── Asset Assignments ───────────────────────────────────────────────────────

  findAssetsByEmployee(employeeId: string, tenantId: string) {
    return this.assetRepo.find({ where: { employee_id: employeeId, tenant_id: tenantId }, order: { assigned_at: 'DESC' } });
  }

  findAllAssets(tenantId: string) {
    return this.assetRepo.find({ where: { tenant_id: tenantId }, order: { assigned_at: 'DESC' } });
  }

  async findOneAsset(id: string, tenantId: string) {
    const asset = await this.assetRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!asset) throw new NotFoundException('Asset assignment not found');
    return asset;
  }

  createAsset(dto: CreateAssetAssignmentDto, tenantId: string) {
    return this.assetRepo.save(
      this.assetRepo.create({ ...dto, tenant_id: tenantId }),
    );
  }

  async returnAsset(id: string, dto: ReturnAssetDto, tenantId: string) {
    const asset = await this.findOneAsset(id, tenantId);
    asset.returned_at = new Date(dto.returned_at);
    if (dto.condition_on_return) asset.condition_on_return = dto.condition_on_return;
    return this.assetRepo.save(asset);
  }
}
