import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserNotification } from '../entities/user-notification.entity.js';
import { CreateNotificationDto } from '../dto/hr-compliance.dto.js';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(UserNotification)
    private readonly notifRepo: Repository<UserNotification>,
  ) {}

  async create(
    tenantId: string,
    dto: CreateNotificationDto,
  ): Promise<UserNotification> {
    const notif = this.notifRepo.create({ ...dto, tenant_id: tenantId });
    return this.notifRepo.save(notif);
  }

  async findUnread(tenantId: string, userId: string): Promise<UserNotification[]> {
    return this.notifRepo.find({
      where: { tenant_id: tenantId, user_id: userId, is_read: false },
      order: { created_at: 'DESC' },
    });
  }

  async findAll(tenantId: string, userId: string): Promise<UserNotification[]> {
    return this.notifRepo.find({
      where: { tenant_id: tenantId, user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async markRead(tenantId: string, id: string, userId: string): Promise<UserNotification> {
    const notif = await this.notifRepo.findOne({
      where: { id, tenant_id: tenantId, user_id: userId },
    });
    if (!notif) throw new NotFoundException(`Notification ${id} not found`);
    notif.is_read = true;
    notif.read_at = new Date();
    return this.notifRepo.save(notif);
  }

  async markAllRead(tenantId: string, userId: string): Promise<void> {
    await this.notifRepo.update(
      { tenant_id: tenantId, user_id: userId, is_read: false },
      { is_read: true, read_at: new Date() },
    );
  }
}
