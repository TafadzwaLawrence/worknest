import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowNotification } from '../entities/workflow-notification.entity.js';
import { PaginationDto } from '../../core/dto/pagination.dto.js';

@Injectable()
export class WorkflowNotificationService {
  constructor(
    @InjectRepository(WorkflowNotification)
    private readonly repo: Repository<WorkflowNotification>,
  ) {}

  async findForUser(recipientId: string, tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.repo.findAndCount({
      where: { recipient_id: recipientId, tenant_id: tenantId },
      order: { sent_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async markRead(id: string, tenantId: string, userId: string): Promise<WorkflowNotification> {
    const notification = await this.repo.findOneOrFail({
      where: { id, tenant_id: tenantId, recipient_id: userId },
    });
    notification.is_read = true;
    notification.read_at = new Date();
    return this.repo.save(notification);
  }

  async markAllRead(recipientId: string, tenantId: string): Promise<{ updated: number }> {
    const result = await this.repo.update(
      { recipient_id: recipientId, tenant_id: tenantId, is_read: false },
      { is_read: true, read_at: new Date() },
    );
    return { updated: result.affected ?? 0 };
  }

  async create(data: Partial<WorkflowNotification>): Promise<WorkflowNotification> {
    const notification = this.repo.create(data);
    return this.repo.save(notification);
  }
}
