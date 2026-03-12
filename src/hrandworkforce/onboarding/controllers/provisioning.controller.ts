import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProvisioningService } from '../services/provisioning.service';
import {
  CreateProvisioningRequestDto,
  UpdateProvisioningStatusDto,
  CreateAssetAssignmentDto,
  ReturnAssetDto,
} from '../dto/onboarding.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../core/entities/user.entity';

@ApiTags('Provisioning & Assets')
@ApiBearerAuth()
@Controller('provisioning')
export class ProvisioningController {
  constructor(private readonly svc: ProvisioningService) {}

  // ─── Provisioning Requests ───────────────────────────────────────────────────

  @Get('requests')
  findAll(@CurrentUser() user: User) {
    return this.svc.findAllForTenant(user.tenant_id);
  }

  @Get('requests/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.findOne(id, user.tenant_id);
  }

  @Post('requests')
  create(@Body() dto: CreateProvisioningRequestDto, @CurrentUser() user: User) {
    return this.svc.create(dto, user.tenant_id, user.id);
  }

  @Patch('requests/:id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProvisioningStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.updateStatus(id, dto, user.tenant_id, user.id);
  }

  // ─── Asset Assignments ───────────────────────────────────────────────────────

  @Get('assets')
  findAllAssets(@CurrentUser() user: User) {
    return this.svc.findAllAssets(user.tenant_id);
  }

  @ApiQuery({ name: 'employeeId', required: false })
  @Get('assets/by-employee')
  findByEmployee(@Query('employeeId', ParseUUIDPipe) employeeId: string, @CurrentUser() user: User) {
    return this.svc.findAssetsByEmployee(employeeId, user.tenant_id);
  }

  @Get('assets/:id')
  findOneAsset(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.findOneAsset(id, user.tenant_id);
  }

  @Post('assets')
  createAsset(@Body() dto: CreateAssetAssignmentDto, @CurrentUser() user: User) {
    return this.svc.createAsset(dto, user.tenant_id);
  }

  @Patch('assets/:id/return')
  returnAsset(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnAssetDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.returnAsset(id, dto, user.tenant_id);
  }
}
