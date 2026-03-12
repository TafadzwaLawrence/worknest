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
import { EssTimeOffService } from '../services/ess-time-off.service.js';
import { SaveTimeOffDraftDto, CreateTimeOffPortalDto } from '../dto/ess.dto.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';

@Controller('ess/time-off')
export class EssTimeOffController {
  constructor(private readonly timeOffService: EssTimeOffService) {}

  @Post('drafts')
  saveDraft(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: SaveTimeOffDraftDto,
  ) {
    return this.timeOffService.saveDraft(user.tenant_id, dto);
  }

  @Get('drafts/:employeeId')
  getDrafts(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.timeOffService.getDrafts(user.tenant_id, employeeId);
  }

  @Patch('drafts/:id')
  updateDraft(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveTimeOffDraftDto,
  ) {
    return this.timeOffService.updateDraft(user.tenant_id, id, dto);
  }

  @Delete('drafts/:id')
  deleteDraft(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.timeOffService.deleteDraft(user.tenant_id, id);
  }

  @Post('portal')
  createPortalRecord(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: CreateTimeOffPortalDto,
  ) {
    return this.timeOffService.createPortalRecord(user.tenant_id, dto);
  }

  @Get('portal/employee/:employeeId')
  getEmployeePortalRecords(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.timeOffService.getEmployeeTimeOffPortalRecords(user.tenant_id, employeeId);
  }

  @Get('portal/leave-request/:leaveRequestId')
  getPortalByLeaveRequest(
    @CurrentUser() user: { tenant_id: string },
    @Param('leaveRequestId', ParseUUIDPipe) leaveRequestId: string,
  ) {
    return this.timeOffService.getPortalRecordByLeaveRequest(user.tenant_id, leaveRequestId);
  }
}
