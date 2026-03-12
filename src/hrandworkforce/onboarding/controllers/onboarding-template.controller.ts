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
import { OnboardingTemplateService } from '../services/onboarding-template.service';
import {
  CreateOnboardingTemplateDto,
  UpdateOnboardingTemplateDto,
  CreateOnboardingTemplateTaskDto,
} from '../dto/onboarding.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../core/entities/user.entity';

@ApiTags('Onboarding Templates')
@ApiBearerAuth()
@Controller('onboarding/templates')
export class OnboardingTemplateController {
  constructor(private readonly svc: OnboardingTemplateService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.svc.findAllOnboarding(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.findOneOnboarding(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateOnboardingTemplateDto, @CurrentUser() user: User) {
    return this.svc.createOnboarding(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOnboardingTemplateDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.updateOnboarding(id, dto, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.removeOnboarding(id, user.tenant_id);
  }

  @Get(':id/tasks')
  findTasks(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.findOnboardingTasks(id, user.tenant_id);
  }

  @Post(':id/tasks')
  createTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOnboardingTemplateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.createOnboardingTask(id, dto, user.tenant_id);
  }

  @Delete(':id/tasks/:taskId')
  removeTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
  ) {
    return this.svc.removeOnboardingTask(taskId, user.tenant_id);
  }
}
