import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../../core/entities/user.entity.js';
import { WorkflowNotificationService } from '../services/workflow-notification.service.js';
import { PaginationDto } from '../../core/dto/pagination.dto.js';

@ApiTags('Workflow Notifications')
@ApiBearerAuth()
@Controller('workflow-notifications')
export class WorkflowNotificationController {
  constructor(private readonly svc: WorkflowNotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.svc.findForUser(user.id, user.tenant_id, pagination);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.markRead(id, user.tenant_id, user.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: User) {
    return this.svc.markAllRead(user.id, user.tenant_id);
  }
}
