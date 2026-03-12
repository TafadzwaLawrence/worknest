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
import { NotificationService } from '../services/notification.service.js';
import { CreateNotificationDto } from '../dto/hr-compliance.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Post()
  create(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: CreateNotificationDto,
  ) {
    return this.service.create(user.tenant_id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { tenant_id: string; id: string }) {
    return this.service.findAll(user.tenant_id, user.id);
  }

  @Get('unread')
  findUnread(@CurrentUser() user: { tenant_id: string; id: string }) {
    return this.service.findUnread(user.tenant_id, user.id);
  }

  @Patch('mark-all-read')
  markAllRead(@CurrentUser() user: { tenant_id: string; id: string }) {
    return this.service.markAllRead(user.tenant_id, user.id);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.markRead(user.tenant_id, id, user.id);
  }
}
