import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../../core/entities/user.entity.js';
import { StorageCategoryService } from '../services/storage-category.service.js';
import {
  CreateStorageLocationDto,
  CreateDocumentCategoryDto,
  CreateRetentionPolicyDto,
  SetDocumentRetentionDto,
} from '../dto/document-management.dto.js';

@ApiTags('Document Management — Storage')
@Controller('documents/storage-locations')
export class StorageLocationController {
  constructor(private readonly service: StorageCategoryService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAllStorage(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.service.findOneStorage(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateStorageLocationDto, @CurrentUser() user: User) {
    return this.service.createStorage(dto, user.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateStorageLocationDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateStorage(id, dto, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.service.removeStorage(id, user.tenant_id);
  }
}

@ApiTags('Document Management — Categories')
@Controller('documents/categories')
export class DocumentCategoryController {
  constructor(private readonly service: StorageCategoryService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAllCategories(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.service.findOneCategory(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateDocumentCategoryDto, @CurrentUser() user: User) {
    return this.service.createCategory(dto, user.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDocumentCategoryDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateCategory(id, dto, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.service.removeCategory(id, user.tenant_id);
  }
}

@ApiTags('Document Management — Retention')
@Controller('documents/retention-policies')
export class RetentionPolicyController {
  constructor(private readonly service: StorageCategoryService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAllPolicies(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.service.findOnePolicy(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateRetentionPolicyDto, @CurrentUser() user: User) {
    return this.service.createPolicy(dto, user.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRetentionPolicyDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updatePolicy(id, dto, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.service.removePolicy(id, user.tenant_id);
  }
}

@ApiTags('Document Management — Retention')
@Controller('documents/:documentId/retention')
export class DocumentRetentionController {
  constructor(private readonly service: StorageCategoryService) {}

  @Get()
  get(@Param('documentId', ParseUUIDPipe) documentId: string, @CurrentUser() user: User) {
    return this.service.getRetention(documentId, user.tenant_id);
  }

  @Post()
  set(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: SetDocumentRetentionDto,
    @CurrentUser() user: User,
  ) {
    return this.service.setRetention(documentId, dto, user.tenant_id);
  }
}
