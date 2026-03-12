import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayStructure } from './entities/pay-structure.entity.js';
import { EmployeeTaxInfo } from './entities/employee-tax-info.entity.js';
import { TaxJurisdiction } from './entities/tax-jurisdiction.entity.js';
import { BenefitPlan } from './entities/benefit-plan.entity.js';
import { BenefitEnrollment } from './entities/benefit-enrollment.entity.js';
import { Dependent } from './entities/dependent.entity.js';
import { PayPeriod } from './entities/pay-period.entity.js';
import { PayrollRun } from './entities/payroll-run.entity.js';
import { PayrollRecord } from './entities/payroll-record.entity.js';
import { PayrollEarning } from './entities/payroll-earning.entity.js';
import { PayrollDeduction } from './entities/payroll-deduction.entity.js';
import { PayrollTax } from './entities/payroll-tax.entity.js';
import { TimeEntry } from './entities/time-entry.entity.js';
import { PayrollAdjustment } from './entities/payroll-adjustment.entity.js';
import { PayrollReport } from './entities/payroll-report.entity.js';
import { ExpenseReport } from './entities/expense-report.entity.js';
import { CompensationService } from './services/compensation.service.js';
import { BenefitsService } from './services/benefits.service.js';
import { PayrollService } from './services/payroll.service.js';
import { TimeEntryService } from './services/time-entry.service.js';
import { PayrollReportService } from './services/payroll-report.service.js';
import { ExpenseService } from './services/expense.service.js';
import {
  PayStructureController,
  EmployeeTaxInfoController,
  TaxJurisdictionController,
} from './controllers/compensation.controller.js';
import {
  BenefitPlanController,
  BenefitEnrollmentController,
  DependentController,
} from './controllers/benefits.controller.js';
import {
  PayPeriodController,
  PayrollRunController,
  PayrollRecordController,
} from './controllers/payroll.controller.js';
import { TimeEntryController } from './controllers/time-entry.controller.js';
import {
  PayrollAdjustmentController,
  PayrollReportController,
} from './controllers/payroll-report.controller.js';
import { ExpenseReportController } from './controllers/expense.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayStructure,
      EmployeeTaxInfo,
      TaxJurisdiction,
      BenefitPlan,
      BenefitEnrollment,
      Dependent,
      PayPeriod,
      PayrollRun,
      PayrollRecord,
      PayrollEarning,
      PayrollDeduction,
      PayrollTax,
      TimeEntry,
      PayrollAdjustment,
      PayrollReport,
      ExpenseReport,
    ]),
  ],
  controllers: [
    PayStructureController,
    EmployeeTaxInfoController,
    TaxJurisdictionController,
    BenefitPlanController,
    BenefitEnrollmentController,
    DependentController,
    PayPeriodController,
    PayrollRunController,
    PayrollRecordController,
    TimeEntryController,
    PayrollAdjustmentController,
    PayrollReportController,
    ExpenseReportController,
  ],
  providers: [
    CompensationService,
    BenefitsService,
    PayrollService,
    TimeEntryService,
    PayrollReportService,
    ExpenseService,
  ],
  exports: [PayrollService, BenefitsService, ExpenseService],
})
export class PayrollModule {}
