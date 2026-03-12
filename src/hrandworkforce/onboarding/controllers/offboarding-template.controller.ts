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
  CreateOffboardingTemplateDto,
  UpdateOffboardingTemplateDto,
  CreateOffboardingTemplateTaskDto,
} from '../dto/onboarding.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../core/entities/user.entity';

@ApiTags('Offboarding Templates')
@ApiBearerAuth()
@Controller('offboarding/templates')
export class OffboardingTemplateController {
  constructor(private readonly svc: OnboardingTemplateService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.svc.findAllOffboarding(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.findOneOffboarding(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateOffboardingTemplateDto, @CurrentUser() user: User) {
    return this.svc.createOffboarding(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOffboardingTemplateDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.updateOffboarding(id, dto, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.removeOffboarding(id, user.tenant_id);
  }

  @Get(':id/tasks')
  findTasks(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.svc.findOffboardingTasks(id, user.tenant_id);
  }

  @Post(':id/tasks')
  createTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOffboardingTemplateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.createOffboardingTask(id, dto, user.tenant_id);
  }

  @Delete(':id/tasks/:taskId')
  removeTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
  ) {
    return this.svc.removeOffboardingTask(taskId, user.tenant_id);
  }
}
