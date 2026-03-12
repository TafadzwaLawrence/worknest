import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { EssSettings } from './entities/ess-settings.entity.js';
import { EssPortalPreferences } from './entities/ess-portal-preferences.entity.js';
import { EssProfileRequest } from './entities/ess-profile-request.entity.js';
import { EssProfileRequestItem } from './entities/ess-profile-request-item.entity.js';
import { EssTimeOffDraft } from './entities/ess-time-off-draft.entity.js';
import { EssTimeOffPortal } from './entities/ess-time-off-portal.entity.js';
import { EssRequiredAcknowledgment } from './entities/ess-required-acknowledgment.entity.js';
import { EssAcknowledgment } from './entities/ess-acknowledgment.entity.js';
import { EssDocumentAccess } from './entities/ess-document-access.entity.js';
import { EssAttachment } from './entities/ess-attachment.entity.js';

// Services
import { EssSettingsService } from './services/ess-settings.service.js';
import { EssProfileService } from './services/ess-profile.service.js';
import { EssTimeOffService } from './services/ess-time-off.service.js';
import { EssDocumentService } from './services/ess-document.service.js';

// Controllers
import { EssSettingsController } from './controllers/ess-settings.controller.js';
import { EssProfileController } from './controllers/ess-profile.controller.js';
import { EssTimeOffController } from './controllers/ess-time-off.controller.js';
import { EssDocumentController } from './controllers/ess-document.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EssSettings,
      EssPortalPreferences,
      EssProfileRequest,
      EssProfileRequestItem,
      EssTimeOffDraft,
      EssTimeOffPortal,
      EssRequiredAcknowledgment,
      EssAcknowledgment,
      EssDocumentAccess,
      EssAttachment,
    ]),
  ],
  controllers: [
    EssSettingsController,
    EssProfileController,
    EssTimeOffController,
    EssDocumentController,
  ],
  providers: [
    EssSettingsService,
    EssProfileService,
    EssTimeOffService,
    EssDocumentService,
  ],
})
export class EmployeeSelfServiceModule {}
