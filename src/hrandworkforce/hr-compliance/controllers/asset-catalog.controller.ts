import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { AssetCatalogService } from '../services/asset-catalog.service.js';
import { CreateAssetDto, UpdateAssetDto } from '../dto/hr-compliance.dto.js';
import { AssetStatus } from '../hr-compliance.enums.js';

@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetCatalogController {
  constructor(private readonly service: AssetCatalogService) {}

  @Post()
  create(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateAssetDto,
  ) {
    return this.service.create(user.tenant_id, user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Query('status') status?: AssetStatus,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.service.findAll(user.tenant_id, { status, assigneeId });
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(user.tenant_id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.service.update(user.tenant_id, id, dto);
  }

  @Delete(':id')
  softDelete(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.softDelete(user.tenant_id, id);
  }
}
