import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { DocumentAcl } from '../entities/document-acl.entity.js';
import { DocumentShare } from '../entities/document-share.entity.js';
import { CreateDocumentAclDto, CreateDocumentShareDto } from '../dto/document-management.dto.js';

@Injectable()
export class DocumentAccessService {
  constructor(
    @InjectRepository(DocumentAcl)
    private readonly aclRepo: Repository<DocumentAcl>,
    @InjectRepository(DocumentShare)
    private readonly shareRepo: Repository<DocumentShare>,
  ) {}

  // ─── ACL ─────────────────────────────────────────────────────────

  async getAcl(documentId: string, tenantId: string): Promise<DocumentAcl[]> {
    return this.aclRepo.find({ where: { document_id: documentId, tenant_id: tenantId } });
  }

  async grantAccess(documentId: string, dto: CreateDocumentAclDto, tenantId: string): Promise<DocumentAcl> {
    const entry = this.aclRepo.create({ ...dto, document_id: documentId, tenant_id: tenantId });
    return this.aclRepo.save(entry);
  }

  async revokeAccess(aclId: string, tenantId: string): Promise<void> {
    const entry = await this.aclRepo.findOne({ where: { id: aclId, tenant_id: tenantId } });
    if (!entry) throw new NotFoundException(`ACL entry ${aclId} not found`);
    await this.aclRepo.remove(entry);
  }

  // ─── Shares ──────────────────────────────────────────────────────

  async getShares(documentId: string, tenantId: string): Promise<DocumentShare[]> {
    return this.shareRepo.find({ where: { document_id: documentId, tenant_id: tenantId } });
  }

  async createShare(documentId: string, dto: CreateDocumentShareDto, tenantId: string, userId: string): Promise<DocumentShare> {
    const token = randomBytes(32).toString('hex');
    return this.shareRepo.save(
      this.shareRepo.create({
        document_id: documentId,
        tenant_id: tenantId,
        token,
        expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
        allowed_actions: dto.allowed_actions ?? ['read'],
        created_by: userId,
      }),
    );
  }

  async revokeShare(shareId: string, tenantId: string): Promise<void> {
    const share = await this.shareRepo.findOne({ where: { id: shareId, tenant_id: tenantId } });
    if (!share) throw new NotFoundException(`Share ${shareId} not found`);
    await this.shareRepo.remove(share);
  }
}
