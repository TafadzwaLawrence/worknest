import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { InstanceStep } from '../entities/instance-step.entity.js';
import { EscalationRule } from '../entities/escalation-rule.entity.js';
import { InstanceStatus } from '../entities/workflow.enums.js';

@Injectable()
export class EscalationService {
  private readonly logger = new Logger(EscalationService.name);

  constructor(
    @InjectRepository(InstanceStep)
    private readonly instanceStepRepo: Repository<InstanceStep>,
    @InjectRepository(EscalationRule)
    private readonly escalationRuleRepo: Repository<EscalationRule>,
  ) {}

  /**
   * Runs every 15 minutes.
   * Finds all PENDING instance steps that have exceeded their step's timeout_hours
   * and transitions them to ESCALATED.
   */
  @Cron('0 */15 * * * *')
  async checkEscalations(): Promise<void> {
    this.logger.debug('Running escalation check…');

    // Load all escalation rules
    const rules = await this.escalationRuleRepo.find({
      relations: ['step'],
    });

    let escalated = 0;

    for (const rule of rules) {
      if (!rule.step) continue;

      const threshold = new Date(Date.now() - rule.after_hours * 3_600_000);

      const staleSteps = await this.instanceStepRepo.find({
        where: {
          step_id: rule.step_id,
          tenant_id: rule.tenant_id,
          status: InstanceStatus.PENDING,
          assigned_at: LessThan(threshold),
        },
      });

      if (staleSteps.length === 0) continue;

      for (const step of staleSteps) {
        step.status = InstanceStatus.ESCALATED;
      }

      await this.instanceStepRepo.save(staleSteps);
      escalated += staleSteps.length;
    }

    if (escalated > 0) {
      this.logger.log(`Escalated ${escalated} overdue step(s)`);
    }
  }

  /** Manual trigger for testing / admin endpoint */
  async runNow(): Promise<{ escalated: number }> {
    await this.checkEscalations();
    return { escalated: 0 };
  }
}
