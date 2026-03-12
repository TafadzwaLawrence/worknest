import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OnboardingTemplate } from './entities/onboarding-template.entity';
import { OnboardingTemplateTask } from './entities/onboarding-template-task.entity';
import { OffboardingTemplate } from './entities/offboarding-template.entity';
import { OffboardingTemplateTask } from './entities/offboarding-template-task.entity';
import { OnboardingCase } from './entities/onboarding-case.entity';
import { OnboardingCaseTask } from './entities/onboarding-case-task.entity';
import { OffboardingCase } from './entities/offboarding-case.entity';
import { OffboardingCaseTask } from './entities/offboarding-case-task.entity';
import { ProvisioningRequest } from './entities/provisioning-request.entity';
import { AssetAssignment } from './entities/asset-assignment.entity';
import { ExitInterview } from './entities/exit-interview.entity';
import { KnowledgeTransferRecord } from './entities/knowledge-transfer-record.entity';
import { ClearanceChecklistItem } from './entities/clearance-checklist-item.entity';
import { OnboardingNote } from './entities/onboarding-note.entity';
import { OffboardingNote } from './entities/offboarding-note.entity';

import { OnboardingTemplateService } from './services/onboarding-template.service';
import { OnboardingCaseService } from './services/onboarding-case.service';
import { OffboardingCaseService } from './services/offboarding-case.service';
import { ProvisioningService } from './services/provisioning.service';

import { OnboardingTemplateController } from './controllers/onboarding-template.controller';
import { OffboardingTemplateController } from './controllers/offboarding-template.controller';
import { OnboardingCaseController } from './controllers/onboarding-case.controller';
import { OffboardingCaseController } from './controllers/offboarding-case.controller';
import { ProvisioningController } from './controllers/provisioning.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OnboardingTemplate,
      OnboardingTemplateTask,
      OffboardingTemplate,
      OffboardingTemplateTask,
      OnboardingCase,
      OnboardingCaseTask,
      OffboardingCase,
      OffboardingCaseTask,
      ProvisioningRequest,
      AssetAssignment,
      ExitInterview,
      KnowledgeTransferRecord,
      ClearanceChecklistItem,
      OnboardingNote,
      OffboardingNote,
    ]),
  ],
  providers: [
    OnboardingTemplateService,
    OnboardingCaseService,
    OffboardingCaseService,
    ProvisioningService,
  ],
  controllers: [
    OnboardingTemplateController,
    OffboardingTemplateController,
    OnboardingCaseController,
    OffboardingCaseController,
    ProvisioningController,
  ],
  exports: [OnboardingCaseService, OffboardingCaseService],
})
export class OnboardingModule {}

