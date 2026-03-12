import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../../core/entities/user.entity.js';
import { PaginationDto } from '../../core/dto/pagination.dto.js';
import { DocumentService } from '../services/document.service.js';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  LinkDocumentDto,
  CreateDocumentTagDto,
} from '../dto/document-management.dto.js';
import { DocOwnerType } from '../entities/document-management.enums.js';

@ApiTags('Document Management — Documents')
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.documentService.findAll(user.tenant_id, pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.documentService.findOne(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateDocumentDto, @CurrentUser() user: User) {
    return this.documentService.create(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: User,
  ) {
    return this.documentService.update(id, dto, user.tenant_id, user.id);
  }

  @Patch(':id/archive')
  archive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.documentService.archive(id, user.tenant_id, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.documentService.remove(id, user.tenant_id, user.id);
  }

  // ─── Links ───────────────────────────────────────────────────────

  @Get(':id/links')
  getLinks(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.documentService.getLinks(id, user.tenant_id);
  }

  @Post(':id/links')
  linkDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkDocumentDto,
    @CurrentUser() user: User,
  ) {
    return this.documentService.linkDocument(id, dto, user.tenant_id, user.id);
  }

  @Delete(':id/links/:ownerType/:ownerId')
  removeLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ownerType') ownerType: DocOwnerType,
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
    @CurrentUser() user: User,
  ) {
    return this.documentService.removeLink(id, ownerType, ownerId, user.tenant_id);
  }

  // ─── Tags ─────────────────────────────────────────────────────────

  @Get(':id/tags')
  getTags(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.documentService.findAllTags(user.tenant_id);
  }

  @Post(':id/tags/:tagId')
  tagDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @CurrentUser() user: User,
  ) {
    return this.documentService.tagDocument(id, tagId, user.tenant_id);
  }

  @Delete(':id/tags/:tagId')
  untagDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @CurrentUser() user: User,
  ) {
    return this.documentService.untagDocument(id, tagId, user.tenant_id);
  }

  // ─── Audit ───────────────────────────────────────────────────────

  @Get(':id/audit')
  getAudit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.documentService.getAuditLog(id, user.tenant_id);
  }
}

@ApiTags('Document Management — Tags')
@Controller('documents/tags')
export class DocumentTagController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.documentService.findAllTags(user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateDocumentTagDto, @CurrentUser() user: User) {
    return this.documentService.createTag(dto, user.tenant_id);
  }
}
