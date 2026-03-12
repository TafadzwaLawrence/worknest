import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Document } from '../entities/document.entity.js';
import { DocumentLink } from '../entities/document-link.entity.js';
import { DocumentTag } from '../entities/document-tag.entity.js';
import { DocumentTaggedItem } from '../entities/document-tagged-item.entity.js';
import { DocumentAuditLog } from '../entities/document-audit-log.entity.js';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  LinkDocumentDto,
  CreateDocumentTagDto,
} from '../dto/document-management.dto.js';
import { PaginationDto } from '../../core/dto/pagination.dto.js';
import { DocStatus, DocOwnerType } from '../entities/document-management.enums.js';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
    @InjectRepository(DocumentLink)
    private readonly linkRepo: Repository<DocumentLink>,
    @InjectRepository(DocumentTag)
    private readonly tagRepo: Repository<DocumentTag>,
    @InjectRepository(DocumentTaggedItem)
    private readonly taggedItemRepo: Repository<DocumentTaggedItem>,
    @InjectRepository(DocumentAuditLog)
    private readonly auditRepo: Repository<DocumentAuditLog>,
  ) {}

  // ─── Documents ───────────────────────────────────────────────────

  async findAll(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.docRepo.findAndCount({
      where: { tenant_id: tenantId, deleted_at: IsNull(), status: DocStatus.ACTIVE },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Document> {
    const doc = await this.docRepo.findOne({
      where: { id, tenant_id: tenantId, deleted_at: IsNull() },
      relations: ['storageLocation'],
    });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc;
  }

  async create(dto: CreateDocumentDto, tenantId: string, userId: string): Promise<Document> {
    const doc = await this.docRepo.save(
      this.docRepo.create({ ...dto, tenant_id: tenantId, created_by: userId }),
    );
    await this.audit(doc.id, tenantId, userId, 'upload');
    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto, tenantId: string, userId: string): Promise<Document> {
    const doc = await this.findOne(id, tenantId);
    Object.assign(doc, dto);
    const saved = await this.docRepo.save(doc);
    await this.audit(id, tenantId, userId, 'update');
    return saved;
  }

  async archive(id: string, tenantId: string, userId: string): Promise<Document> {
    const doc = await this.findOne(id, tenantId);
    doc.status = DocStatus.ARCHIVED;
    const saved = await this.docRepo.save(doc);
    await this.audit(id, tenantId, userId, 'archive');
    return saved;
  }

  async remove(id: string, tenantId: string, userId: string): Promise<void> {
    const doc = await this.findOne(id, tenantId);
    await this.audit(id, tenantId, userId, 'delete');
    await this.docRepo.softRemove(doc);
  }

  // ─── Links ───────────────────────────────────────────────────────

  async linkDocument(documentId: string, dto: LinkDocumentDto, tenantId: string, userId: string): Promise<DocumentLink> {
    await this.findOne(documentId, tenantId);
    const existing = await this.linkRepo.findOne({
      where: { document_id: documentId, owner_type: dto.owner_type as DocOwnerType, owner_id: dto.owner_id },
    });
    if (existing) return existing;
    return this.linkRepo.save(
      this.linkRepo.create({
        document_id: documentId,
        owner_type: dto.owner_type,
        owner_id: dto.owner_id,
        tenant_id: tenantId,
        linked_by: userId,
      }),
    );
  }

  async getLinks(documentId: string, tenantId: string): Promise<DocumentLink[]> {
    await this.findOne(documentId, tenantId);
    return this.linkRepo.find({ where: { document_id: documentId, tenant_id: tenantId } });
  }

  async removeLink(documentId: string, ownerType: DocOwnerType, ownerId: string, tenantId: string): Promise<void> {
    await this.linkRepo.delete({ document_id: documentId, owner_type: ownerType, owner_id: ownerId, tenant_id: tenantId });
  }

  // ─── Tags ────────────────────────────────────────────────────────

  async findAllTags(tenantId: string): Promise<DocumentTag[]> {
    return this.tagRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async createTag(dto: CreateDocumentTagDto, tenantId: string): Promise<DocumentTag> {
    const exists = await this.tagRepo.findOne({ where: { tenant_id: tenantId, name: dto.name } });
    if (exists) throw new ConflictException(`Tag '${dto.name}' already exists`);
    return this.tagRepo.save(this.tagRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async tagDocument(documentId: string, tagId: string, tenantId: string): Promise<DocumentTaggedItem> {
    const existing = await this.taggedItemRepo.findOne({ where: { document_id: documentId, tag_id: tagId } });
    if (existing) return existing;
    return this.taggedItemRepo.save(
      this.taggedItemRepo.create({ document_id: documentId, tag_id: tagId, tenant_id: tenantId }),
    );
  }

  async untagDocument(documentId: string, tagId: string, tenantId: string): Promise<void> {
    await this.taggedItemRepo.delete({ document_id: documentId, tag_id: tagId, tenant_id: tenantId });
  }

  // ─── Audit ───────────────────────────────────────────────────────

  async audit(
    documentId: string,
    tenantId: string,
    actorId: string,
    event: string,
    details: Record<string, unknown> = {},
  ): Promise<void> {
    await this.auditRepo.save(
      this.auditRepo.create({
        document_id: documentId,
        tenant_id: tenantId,
        actor_user_id: actorId,
        event,
        details,
      }),
    );
  }

  async getAuditLog(documentId: string, tenantId: string): Promise<DocumentAuditLog[]> {
    await this.findOne(documentId, tenantId);
    return this.auditRepo.find({
      where: { document_id: documentId, tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }
}
