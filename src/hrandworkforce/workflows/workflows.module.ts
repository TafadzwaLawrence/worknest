import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity.js';
import { WorkflowStep } from './entities/workflow-step.entity.js';
import { StepAssignment } from './entities/step-assignment.entity.js';
import { EscalationRule } from './entities/escalation-rule.entity.js';
import { WorkflowInstance } from './entities/workflow-instance.entity.js';
import { InstanceStep } from './entities/instance-step.entity.js';
import { StepAction } from './entities/step-action.entity.js';
import { StepDelegation } from './entities/step-delegation.entity.js';
import { WorkflowNotification } from './entities/workflow-notification.entity.js';
import { NotificationTemplate } from './entities/notification-template.entity.js';
import { WorkflowCondition } from './entities/workflow-condition.entity.js';
import { ConditionGroup } from './entities/condition-group.entity.js';
import { WorkflowMetrics } from './entities/workflow-metrics.entity.js';
import { StepMetrics } from './entities/step-metrics.entity.js';
import { LeaveRequestWorkflow } from './entities/leave-request-workflow.entity.js';
import { ExpenseWorkflow } from './entities/expense-workflow.entity.js';
import { WorkflowDefinitionService } from './services/workflow-definition.service.js';
import { WorkflowInstanceService } from './services/workflow-instance.service.js';
import { WorkflowNotificationService } from './services/workflow-notification.service.js';
import { EscalationService } from './services/escalation.service.js';
import { WorkflowController } from './controllers/workflow.controller.js';
import { WorkflowInstanceController } from './controllers/workflow-instance.controller.js';
import { WorkflowNotificationController } from './controllers/workflow-notification.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowStep,
      StepAssignment,
      EscalationRule,
      WorkflowInstance,
      InstanceStep,
      StepAction,
      StepDelegation,
      WorkflowNotification,
      NotificationTemplate,
      WorkflowCondition,
      ConditionGroup,
      WorkflowMetrics,
      StepMetrics,
      LeaveRequestWorkflow,
      ExpenseWorkflow,
    ]),
  ],
  controllers: [
    WorkflowController,
    WorkflowInstanceController,
    WorkflowNotificationController,
  ],
  providers: [
    WorkflowDefinitionService,
    WorkflowInstanceService,
    WorkflowNotificationService,
    EscalationService,
  ],
  exports: [WorkflowDefinitionService, WorkflowInstanceService],
})
export class WorkflowsModule {}
