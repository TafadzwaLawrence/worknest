import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { DisciplinaryService } from '../services/disciplinary.service.js';
import {
  CreateDisciplinaryCaseDto,
  UpdateDisciplinaryCaseDto,
  AttachDocumentDto,
  CreatePipRecordDto,
  UpdatePipRecordDto,
} from '../dto/hr-compliance.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('disciplinary')
export class DisciplinaryController {
  constructor(private readonly service: DisciplinaryService) {}

  // ── Cases ─────────────────────────────────────────────────────────────────

  @Post('cases')
  createCase(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateDisciplinaryCaseDto,
  ) {
    return this.service.createCase(user.tenant_id, user.id, dto);
  }

  @Get('cases')
  findAllCases(@CurrentUser() user: { tenant_id: string }) {
    return this.service.findAllCases(user.tenant_id);
  }

  @Get('cases/employee/:employeeId')
  findCasesByEmployee(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.service.findCasesByEmployee(user.tenant_id, employeeId);
  }

  @Get('cases/:id')
  findOneCase(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOneCase(user.tenant_id, id);
  }

  @Patch('cases/:id')
  updateCase(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDisciplinaryCaseDto,
  ) {
    return this.service.updateCase(user.tenant_id, id, dto);
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  @Post('cases/:caseId/documents')
  attachDocument(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: AttachDocumentDto,
  ) {
    return this.service.attachDocument(user.tenant_id, caseId, user.id, dto);
  }

  @Get('cases/:caseId/documents')
  listDocuments(
    @CurrentUser() user: { tenant_id: string },
    @Param('caseId', ParseUUIDPipe) caseId: string,
  ) {
    return this.service.listDocuments(user.tenant_id, caseId);
  }

  // ── PIP Records ───────────────────────────────────────────────────────────

  @Post('pip')
  createPip(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreatePipRecordDto,
  ) {
    return this.service.createPip(user.tenant_id, user.id, dto);
  }

  @Get('pip')
  findAllPips(@CurrentUser() user: { tenant_id: string }) {
    return this.service.findAllPips(user.tenant_id);
  }

  @Get('pip/employee/:employeeId')
  findPipsByEmployee(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.service.findPipsByEmployee(user.tenant_id, employeeId);
  }

  @Get('pip/:id')
  findOnePip(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOnePip(user.tenant_id, id);
  }

  @Patch('pip/:id')
  updatePip(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePipRecordDto,
  ) {
    return this.service.updatePip(user.tenant_id, id, dto);
  }
}
