import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../../core/entities/user.entity.js';
import { DocumentAccessService } from '../services/document-access.service.js';
import {
  CreateDocumentAclDto,
  CreateDocumentShareDto,
} from '../dto/document-management.dto.js';

@ApiTags('Document Management — Access')
@Controller('documents/:documentId/acl')
export class DocumentAclController {
  constructor(private readonly accessService: DocumentAccessService) {}

  @Get()
  getAcl(@Param('documentId', ParseUUIDPipe) documentId: string, @CurrentUser() user: User) {
    return this.accessService.getAcl(documentId, user.tenant_id);
  }

  @Post()
  grantAccess(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: CreateDocumentAclDto,
    @CurrentUser() user: User,
  ) {
    return this.accessService.grantAccess(documentId, dto, user.tenant_id);
  }

  @Delete(':aclId')
  revokeAccess(
    @Param('aclId', ParseUUIDPipe) aclId: string,
    @CurrentUser() user: User,
  ) {
    return this.accessService.revokeAccess(aclId, user.tenant_id);
  }
}

@ApiTags('Document Management — Access')
@Controller('documents/:documentId/shares')
export class DocumentShareController {
  constructor(private readonly accessService: DocumentAccessService) {}

  @Get()
  getShares(@Param('documentId', ParseUUIDPipe) documentId: string, @CurrentUser() user: User) {
    return this.accessService.getShares(documentId, user.tenant_id);
  }

  @Post()
  createShare(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: CreateDocumentShareDto,
    @CurrentUser() user: User,
  ) {
    return this.accessService.createShare(documentId, dto, user.tenant_id, user.id);
  }

  @Delete(':shareId')
  revokeShare(
    @Param('shareId', ParseUUIDPipe) shareId: string,
    @CurrentUser() user: User,
  ) {
    return this.accessService.revokeShare(shareId, user.tenant_id);
  }
}
