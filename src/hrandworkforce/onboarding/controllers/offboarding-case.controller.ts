import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OffboardingCaseService } from '../services/offboarding-case.service';
import {
  CreateOffboardingCaseDto,
  UpdateOffboardingCaseDto,
  CreateOffboardingCaseTaskDto,
  UpdateOffboardingCaseTaskDto,
  CreateOffboardingNoteDto,
  CreateExitInterviewDto,
  UpdateExitInterviewDto,
  CreateKnowledgeTransferDto,
  CreateClearanceItemDto,
  UpdateClearanceItemDto,
} from '../dto/onboarding.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../core/entities/user.entity';

@ApiTags('Offboarding Cases')
@ApiBearerAuth()
@Controller('offboarding/cases')
export class OffboardingCaseController {
  constructor(private readonly svc: OffboardingCaseService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.svc.findAll(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.findOne(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateOffboardingCaseDto, @CurrentUser() user: User) {
    return this.svc.create(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOffboardingCaseDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.update(id, dto, user.tenant_id, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.remove(id, user.tenant_id);
  }

  // ─── Tasks ────────────────────────────────────────────────────────────────────

  @Get(':id/tasks')
  findTasks(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.findTasks(id, user.tenant_id);
  }

  @Post(':id/tasks')
  createTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOffboardingCaseTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.createTask(id, dto, user.tenant_id);
  }

  @Patch(':id/tasks/:taskId')
  updateTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateOffboardingCaseTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.updateTask(taskId, dto, user.tenant_id);
  }

  @Delete(':id/tasks/:taskId')
  removeTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
  ) {
    return this.svc.removeTask(taskId, user.tenant_id);
  }

  // ─── Notes ────────────────────────────────────────────────────────────────────

  @Get(':id/notes')
  findNotes(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.findNotes(id, user.tenant_id);
  }

  @Post(':id/notes')
  createNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOffboardingNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.createNote(id, dto, user.tenant_id, user.id);
  }

  @Delete(':id/notes/:noteId')
  removeNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @CurrentUser() user: User,
  ) {
    return this.svc.removeNote(noteId, user.tenant_id);
  }

  // ─── Exit Interviews ─────────────────────────────────────────────────────────

  @Get(':id/exit-interviews')
  findExitInterviews(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.findExitInterviews(id, user.tenant_id);
  }

  @Post(':id/exit-interviews')
  createExitInterview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateExitInterviewDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.createExitInterview(id, dto, user.tenant_id);
  }

  @Patch(':id/exit-interviews/:interviewId')
  updateExitInterview(
    @Param('interviewId', ParseUUIDPipe) interviewId: string,
    @Body() dto: UpdateExitInterviewDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.updateExitInterview(interviewId, dto, user.tenant_id);
  }

  // ─── Knowledge Transfer ──────────────────────────────────────────────────────

  @Get(':id/knowledge-transfers')
  findKnowledgeTransfers(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.findKnowledgeTransfers(id, user.tenant_id);
  }

  @Post(':id/knowledge-transfers')
  createKnowledgeTransfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateKnowledgeTransferDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.createKnowledgeTransfer(id, dto, user.tenant_id);
  }

  // ─── Clearance Checklist ─────────────────────────────────────────────────────

  @Get(':id/clearance')
  findClearanceItems(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.findClearanceItems(id, user.tenant_id);
  }

  @Post(':id/clearance')
  createClearanceItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateClearanceItemDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.createClearanceItem(id, dto, user.tenant_id);
  }

  @Patch(':id/clearance/:itemId')
  updateClearanceItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateClearanceItemDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.updateClearanceItem(itemId, dto, user.tenant_id);
  }
}
