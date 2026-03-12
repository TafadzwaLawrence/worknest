import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetCatalog } from '../entities/asset-catalog.entity.js';
import { CreateAssetDto, UpdateAssetDto } from '../dto/hr-compliance.dto.js';
import { AssetStatus } from '../hr-compliance.enums.js';

@Injectable()
export class AssetCatalogService {
  constructor(
    @InjectRepository(AssetCatalog)
    private readonly assetRepo: Repository<AssetCatalog>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateAssetDto,
  ): Promise<AssetCatalog> {
    const asset = this.assetRepo.create({
      ...dto,
      tenant_id: tenantId,
      created_by: userId,
    });
    return this.assetRepo.save(asset);
  }

  async findAll(
    tenantId: string,
    filters?: { status?: AssetStatus; assigneeId?: string },
  ): Promise<AssetCatalog[]> {
    const where: Record<string, unknown> = { tenant_id: tenantId };
    if (filters?.status) where.current_status = filters.status;
    if (filters?.assigneeId) where.current_assignee_id = filters.assigneeId;
    return this.assetRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<AssetCatalog> {
    const asset = await this.assetRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!asset) throw new NotFoundException(`Asset ${id} not found`);
    return asset;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAssetDto,
  ): Promise<AssetCatalog> {
    const asset = await this.findOne(tenantId, id);
    Object.assign(asset, dto);
    return this.assetRepo.save(asset);
  }

  async softDelete(tenantId: string, id: string): Promise<void> {
    const asset = await this.findOne(tenantId, id);
    await this.assetRepo.softDelete(asset.id);
  }
}
