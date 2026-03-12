import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageLocation } from './entities/storage-location.entity.js';
import { Document } from './entities/document.entity.js';
import { DocumentLink } from './entities/document-link.entity.js';
import { DocumentCategory } from './entities/document-category.entity.js';
import { DocumentTag } from './entities/document-tag.entity.js';
import { DocumentTaggedItem } from './entities/document-tagged-item.entity.js';
import { RetentionPolicy } from './entities/retention-policy.entity.js';
import { DocumentRetention } from './entities/document-retention.entity.js';
import { DocumentAcl } from './entities/document-acl.entity.js';
import { DocumentShare } from './entities/document-share.entity.js';
import { DocumentAuditLog } from './entities/document-audit-log.entity.js';
import { DocumentService } from './services/document.service.js';
import { StorageCategoryService } from './services/storage-category.service.js';
import { DocumentAccessService } from './services/document-access.service.js';
import { DocumentController, DocumentTagController } from './controllers/document.controller.js';
import {
  StorageLocationController,
  DocumentCategoryController,
  RetentionPolicyController,
  DocumentRetentionController,
} from './controllers/storage-category.controller.js';
import { DocumentAclController, DocumentShareController } from './controllers/document-access.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StorageLocation,
      Document,
      DocumentLink,
      DocumentCategory,
      DocumentTag,
      DocumentTaggedItem,
      RetentionPolicy,
      DocumentRetention,
      DocumentAcl,
      DocumentShare,
      DocumentAuditLog,
    ]),
  ],
  controllers: [
    DocumentController,
    DocumentTagController,
    StorageLocationController,
    DocumentCategoryController,
    RetentionPolicyController,
    DocumentRetentionController,
    DocumentAclController,
    DocumentShareController,
  ],
  providers: [
    DocumentService,
    StorageCategoryService,
    DocumentAccessService,
  ],
  exports: [DocumentService],
})
export class DocumentManagementModule {}
