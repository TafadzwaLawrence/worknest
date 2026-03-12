import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { EssDocumentService } from '../services/ess-document.service.js';
import {
  CreateRequiredAcknowledgmentDto,
  AcknowledgeDocumentDto,
  WaiveAcknowledgmentDto,
  LogDocumentAccessDto,
  AddAttachmentDto,
} from '../dto/ess.dto.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';

@Controller('ess/documents')
export class EssDocumentController {
  constructor(private readonly documentService: EssDocumentService) {}

  @Post('required-acks')
  createRequiredAck(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateRequiredAcknowledgmentDto,
  ) {
    return this.documentService.createRequiredAcknowledgment(user.tenant_id, dto, user.id);
  }

  @Get('required-acks')
  findAllRequiredAcks(@CurrentUser() user: { tenant_id: string }) {
    return this.documentService.findAllRequiredAcknowledgments(user.tenant_id);
  }

  @Post('acknowledge')
  acknowledge(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: AcknowledgeDocumentDto,
  ) {
    return this.documentService.acknowledgeDocument(user.tenant_id, dto);
  }

  @Post('waive')
  waive(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: WaiveAcknowledgmentDto,
  ) {
    return this.documentService.waiveAcknowledgment(user.tenant_id, dto);
  }

  @Get('acks/:employeeId')
  getEmployeeAcks(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.documentService.getEmployeeAcknowledgments(user.tenant_id, employeeId);
  }

  @Post('access-log')
  logAccess(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: LogDocumentAccessDto,
  ) {
    return this.documentService.logDocumentAccess(user.tenant_id, dto);
  }

  @Get('access-log/:employeeId')
  getAccessLogs(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.documentService.getDocumentAccessLogs(user.tenant_id, employeeId);
  }

  @Post('attachments')
  addAttachment(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: AddAttachmentDto,
  ) {
    return this.documentService.addAttachment(user.tenant_id, dto, user.id);
  }

  @Get('attachments')
  getAttachments(
    @CurrentUser() user: { tenant_id: string },
    @Query('ownerType') ownerType: string,
    @Query('ownerId') ownerId: string,
  ) {
    return this.documentService.getAttachments(user.tenant_id, ownerType, ownerId);
  }
}
