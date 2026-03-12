import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageLocation } from '../entities/storage-location.entity.js';
import { DocumentCategory } from '../entities/document-category.entity.js';
import { RetentionPolicy } from '../entities/retention-policy.entity.js';
import { DocumentRetention } from '../entities/document-retention.entity.js';
import {
  CreateStorageLocationDto,
  CreateDocumentCategoryDto,
  CreateRetentionPolicyDto,
  SetDocumentRetentionDto,
} from '../dto/document-management.dto.js';
import { IsNull } from 'typeorm';

@Injectable()
export class StorageCategoryService {
  constructor(
    @InjectRepository(StorageLocation)
    private readonly storageRepo: Repository<StorageLocation>,
    @InjectRepository(DocumentCategory)
    private readonly categoryRepo: Repository<DocumentCategory>,
    @InjectRepository(RetentionPolicy)
    private readonly retentionPolicyRepo: Repository<RetentionPolicy>,
    @InjectRepository(DocumentRetention)
    private readonly retentionRepo: Repository<DocumentRetention>,
  ) {}

  // ─── Storage Locations ───────────────────────────────────────────

  async findAllStorage(tenantId: string): Promise<StorageLocation[]> {
    return this.storageRepo.find({
      where: { tenant_id: tenantId, deleted_at: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async findOneStorage(id: string, tenantId: string): Promise<StorageLocation> {
    const loc = await this.storageRepo.findOne({ where: { id, tenant_id: tenantId, deleted_at: IsNull() } });
    if (!loc) throw new NotFoundException(`Storage location ${id} not found`);
    return loc;
  }

  async createStorage(dto: CreateStorageLocationDto, tenantId: string): Promise<StorageLocation> {
    const exists = await this.storageRepo.findOne({ where: { tenant_id: tenantId, name: dto.name, deleted_at: IsNull() } });
    if (exists) throw new ConflictException(`Storage location '${dto.name}' already exists`);
    return this.storageRepo.save(this.storageRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async updateStorage(id: string, dto: Partial<CreateStorageLocationDto>, tenantId: string): Promise<StorageLocation> {
    const loc = await this.findOneStorage(id, tenantId);
    Object.assign(loc, dto);
    return this.storageRepo.save(loc);
  }

  async removeStorage(id: string, tenantId: string): Promise<void> {
    const loc = await this.findOneStorage(id, tenantId);
    await this.storageRepo.softRemove(loc);
  }

  // ─── Categories ──────────────────────────────────────────────────

  async findAllCategories(tenantId: string): Promise<DocumentCategory[]> {
    return this.categoryRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findOneCategory(id: string, tenantId: string): Promise<DocumentCategory> {
    const cat = await this.categoryRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    return cat;
  }

  async createCategory(dto: CreateDocumentCategoryDto, tenantId: string): Promise<DocumentCategory> {
    const exists = await this.categoryRepo.findOne({ where: { tenant_id: tenantId, name: dto.name } });
    if (exists) throw new ConflictException(`Category '${dto.name}' already exists`);
    return this.categoryRepo.save(this.categoryRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async updateCategory(id: string, dto: Partial<CreateDocumentCategoryDto>, tenantId: string): Promise<DocumentCategory> {
    const cat = await this.findOneCategory(id, tenantId);
    Object.assign(cat, dto);
    return this.categoryRepo.save(cat);
  }

  async removeCategory(id: string, tenantId: string): Promise<void> {
    const cat = await this.findOneCategory(id, tenantId);
    await this.categoryRepo.remove(cat);
  }

  // ─── Retention Policies ──────────────────────────────────────────

  async findAllPolicies(tenantId: string): Promise<RetentionPolicy[]> {
    return this.retentionPolicyRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findOnePolicy(id: string, tenantId: string): Promise<RetentionPolicy> {
    const policy = await this.retentionPolicyRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!policy) throw new NotFoundException(`Retention policy ${id} not found`);
    return policy;
  }

  async createPolicy(dto: CreateRetentionPolicyDto, tenantId: string): Promise<RetentionPolicy> {
    const exists = await this.retentionPolicyRepo.findOne({ where: { tenant_id: tenantId, name: dto.name } });
    if (exists) throw new ConflictException(`Retention policy '${dto.name}' already exists`);
    return this.retentionPolicyRepo.save(this.retentionPolicyRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async updatePolicy(id: string, dto: Partial<CreateRetentionPolicyDto>, tenantId: string): Promise<RetentionPolicy> {
    const policy = await this.findOnePolicy(id, tenantId);
    Object.assign(policy, dto);
    return this.retentionPolicyRepo.save(policy);
  }

  async removePolicy(id: string, tenantId: string): Promise<void> {
    const policy = await this.findOnePolicy(id, tenantId);
    await this.retentionPolicyRepo.remove(policy);
  }

  // ─── Document Retention ──────────────────────────────────────────

  async getRetention(documentId: string, tenantId: string): Promise<DocumentRetention | null> {
    return this.retentionRepo.findOne({ where: { document_id: documentId, tenant_id: tenantId } });
  }

  async setRetention(documentId: string, dto: SetDocumentRetentionDto, tenantId: string): Promise<DocumentRetention> {
    const existing = await this.retentionRepo.findOne({ where: { document_id: documentId } });
    if (existing) {
      Object.assign(existing, dto);
      return this.retentionRepo.save(existing);
    }
    return this.retentionRepo.save(
      this.retentionRepo.create({ ...dto, document_id: documentId, tenant_id: tenantId }),
    );
  }
}
