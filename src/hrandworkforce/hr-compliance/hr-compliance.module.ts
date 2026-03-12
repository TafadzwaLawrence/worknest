import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SalaryRevision } from './entities/salary-revision.entity.js';
import { AssetCatalog } from './entities/asset-catalog.entity.js';
import { DisciplinaryCase } from './entities/disciplinary-case.entity.js';
import { DisciplinaryDocument } from './entities/disciplinary-document.entity.js';
import { PipRecord } from './entities/pip-record.entity.js';
import { UserNotification } from './entities/user-notification.entity.js';
import { EmployeeLoan } from './entities/employee-loan.entity.js';
import { LoanRepayment } from './entities/loan-repayment.entity.js';

import { SalaryRevisionService } from './services/salary-revision.service.js';
import { AssetCatalogService } from './services/asset-catalog.service.js';
import { DisciplinaryService } from './services/disciplinary.service.js';
import { LoanService } from './services/loan.service.js';
import { NotificationService } from './services/notification.service.js';

import { SalaryRevisionController } from './controllers/salary-revision.controller.js';
import { AssetCatalogController } from './controllers/asset-catalog.controller.js';
import { DisciplinaryController } from './controllers/disciplinary.controller.js';
import { LoanController } from './controllers/loan.controller.js';
import { NotificationController } from './controllers/notification.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalaryRevision,
      AssetCatalog,
      DisciplinaryCase,
      DisciplinaryDocument,
      PipRecord,
      UserNotification,
      EmployeeLoan,
      LoanRepayment,
    ]),
  ],
  controllers: [
    SalaryRevisionController,
    AssetCatalogController,
    DisciplinaryController,
    LoanController,
    NotificationController,
  ],
  providers: [
    SalaryRevisionService,
    AssetCatalogService,
    DisciplinaryService,
    LoanService,
    NotificationService,
  ],
  exports: [
    SalaryRevisionService,
    AssetCatalogService,
    DisciplinaryService,
    LoanService,
    NotificationService,
  ],
})
export class HrComplianceModule {}
