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
import { OnboardingCaseService } from '../services/onboarding-case.service';
import {
  CreateOnboardingCaseDto,
  UpdateOnboardingCaseDto,
  CreateOnboardingCaseTaskDto,
  UpdateOnboardingCaseTaskDto,
  CreateOnboardingNoteDto,
} from '../dto/onboarding.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../core/entities/user.entity';

@ApiTags('Onboarding Cases')
@ApiBearerAuth()
@Controller('onboarding/cases')
export class OnboardingCaseController {
  constructor(private readonly svc: OnboardingCaseService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.svc.findAll(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.findOne(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateOnboardingCaseDto, @CurrentUser() user: User) {
    return this.svc.create(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOnboardingCaseDto,
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
    @Body() dto: CreateOnboardingCaseTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.createTask(id, dto, user.tenant_id);
  }

  @Patch(':id/tasks/:taskId')
  updateTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateOnboardingCaseTaskDto,
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
    @Body() dto: CreateOnboardingNoteDto,
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
}
