import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { CoreModule } from './hrandworkforce/core/core.module.js';
import { AuthModule } from './hrandworkforce/auth/auth.module.js';
import { WorkflowsModule } from './hrandworkforce/workflows/workflows.module.js';
import { RecruitmentModule } from './hrandworkforce/recruitment/recruitment.module.js';
import { DocumentManagementModule } from './hrandworkforce/document-management/document-management.module.js';
import { OnboardingModule } from './hrandworkforce/onboarding/onboarding.module.js';
import { TimeAttendanceModule } from './hrandworkforce/time-attendance/time-attendance.module.js';
import { PayrollModule } from './hrandworkforce/payroll/payroll.module.js';
import { PerformanceModule } from './hrandworkforce/performance/performance.module.js';
import { EngagementModule } from './hrandworkforce/engagement/engagement.module.js';
import { EmployeeSelfServiceModule } from './hrandworkforce/employee-self-service/employee-self-service.module.js';
import { HrComplianceModule } from './hrandworkforce/hr-compliance/hr-compliance.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtAuthGuard } from './hrandworkforce/auth/guards/jwt-auth.guard.js';
import appConfig from './config/app.config.js';
import databaseConfig from './config/database.config.js';
import jwtConfig from './config/jwt.config.js';
import supabaseConfig from './config/supabase.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, supabaseConfig],
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    SupabaseModule,
    CoreModule,
    AuthModule,
    WorkflowsModule,
    RecruitmentModule,
    DocumentManagementModule,
    OnboardingModule,
    TimeAttendanceModule,
    PayrollModule,
    PerformanceModule,
    EngagementModule,
    EmployeeSelfServiceModule,
    HrComplianceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
