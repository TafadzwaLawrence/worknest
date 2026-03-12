import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EssProfileService } from '../services/ess-profile.service.js';
import {
  CreateProfileRequestDto,
  ReviewProfileRequestDto,
  AddProfileRequestItemDto,
} from '../dto/ess.dto.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';

@Controller('ess/profile-requests')
export class EssProfileController {
  constructor(private readonly profileService: EssProfileService) {}

  @Post()
  create(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: CreateProfileRequestDto,
  ) {
    return this.profileService.createRequest(user.tenant_id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { tenant_id: string }) {
    return this.profileService.findAllRequests(user.tenant_id);
  }

  @Get('employee/:employeeId')
  findByEmployee(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.profileService.findRequestsByEmployee(user.tenant_id, employeeId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.profileService.findRequestById(user.tenant_id, id);
  }

  @Patch(':id/review')
  review(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewProfileRequestDto,
  ) {
    return this.profileService.reviewRequest(user.tenant_id, id, dto, user.id);
  }

  @Patch(':id/cancel')
  cancel(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.profileService.cancelRequest(user.tenant_id, id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.profileService.deleteRequest(user.tenant_id, id);
  }

  @Post('items')
  addItem(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: AddProfileRequestItemDto,
  ) {
    return this.profileService.addRequestItem(user.tenant_id, dto);
  }

  @Get(':id/items')
  getItems(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) requestId: string,
  ) {
    return this.profileService.getRequestItems(user.tenant_id, requestId);
  }
}
