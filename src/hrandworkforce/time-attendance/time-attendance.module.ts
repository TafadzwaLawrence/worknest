import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftTemplate } from './entities/shift-template.entity.js';
import { AttendanceRule } from './entities/attendance-rule.entity.js';
import { AttendanceRecord } from './entities/attendance-record.entity.js';
import { AttendanceCorrection } from './entities/attendance-correction.entity.js';
import { LeaveType } from './entities/leave-type.entity.js';
import { LeavePeriod } from './entities/leave-period.entity.js';
import { EmployeeLeaveEntitlement } from './entities/employee-leave-entitlement.entity.js';
import { LeaveRequest } from './entities/leave-request.entity.js';
import { LeaveRequestApproval } from './entities/leave-request-approval.entity.js';
import { Holiday } from './entities/holiday.entity.js';
import { Schedule } from './entities/schedule.entity.js';
import { ScheduledShift } from './entities/scheduled-shift.entity.js';
import { ShiftSwap } from './entities/shift-swap.entity.js';
import { TimeOffRequest } from './entities/time-off-request.entity.js';
import { Timesheet } from './entities/timesheet.entity.js';
import { OvertimeRequest } from './entities/overtime-request.entity.js';
import { AttendanceService } from './services/attendance.service.js';
import { LeaveService } from './services/leave.service.js';
import { HolidayService } from './services/holiday.service.js';
import { ScheduleService } from './services/schedule.service.js';
import { TimesheetService } from './services/timesheet.service.js';
import { ShiftTemplateController } from './controllers/shift-template.controller.js';
import {
  AttendanceRuleController,
  AttendanceRecordController,
  AttendanceCorrectionController,
} from './controllers/attendance.controller.js';
import {
  LeaveTypeController,
  LeavePeriodController,
  LeaveEntitlementController,
  LeaveRequestController,
} from './controllers/leave.controller.js';
import { HolidayController } from './controllers/holiday.controller.js';
import {
  ScheduleController,
  ShiftSwapController,
  TimeOffRequestController,
} from './controllers/schedule.controller.js';
import { TimesheetController, OvertimeRequestController } from './controllers/timesheet.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShiftTemplate,
      AttendanceRule,
      AttendanceRecord,
      AttendanceCorrection,
      LeaveType,
      LeavePeriod,
      EmployeeLeaveEntitlement,
      LeaveRequest,
      LeaveRequestApproval,
      Holiday,
      Schedule,
      ScheduledShift,
      ShiftSwap,
      TimeOffRequest,
      Timesheet,
      OvertimeRequest,
    ]),
  ],
  controllers: [
    ShiftTemplateController,
    AttendanceRuleController,
    AttendanceRecordController,
    AttendanceCorrectionController,
    LeaveTypeController,
    LeavePeriodController,
    LeaveEntitlementController,
    LeaveRequestController,
    HolidayController,
    ScheduleController,
    ShiftSwapController,
    TimeOffRequestController,
    TimesheetController,
    OvertimeRequestController,
  ],
  providers: [
    AttendanceService,
    LeaveService,
    HolidayService,
    ScheduleService,
    TimesheetService,
  ],
  exports: [LeaveService, TimesheetService],
})
export class TimeAttendanceModule {}

