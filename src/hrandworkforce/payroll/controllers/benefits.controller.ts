import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../../core/entities/user.entity.js';
import { BenefitsService } from '../services/benefits.service.js';
import {
  CreateBenefitPlanDto,
  UpdateBenefitPlanDto,
  CreateBenefitEnrollmentDto,
  UpdateBenefitEnrollmentDto,
  CreateDependentDto,
  UpdateDependentDto,
} from '../dto/payroll.dto.js';

@ApiTags('Payroll — Benefit Plans')
@Controller('payroll/benefit-plans')
export class BenefitPlanController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('active') active?: string) {
    return this.benefitsService.findAllPlans(user.tenant_id, active === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.benefitsService.findOnePlan(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateBenefitPlanDto, @CurrentUser() user: User) {
    return this.benefitsService.createPlan(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBenefitPlanDto,
    @CurrentUser() user: User,
  ) {
    return this.benefitsService.updatePlan(id, dto, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.benefitsService.removePlan(id, user.tenant_id);
  }
}

@ApiTags('Payroll — Benefit Enrollments')
@Controller('payroll/benefit-enrollments')
export class BenefitEnrollmentController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('employee_id') employeeId?: string) {
    return this.benefitsService.findEnrollments(user.tenant_id, employeeId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.benefitsService.findOneEnrollment(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateBenefitEnrollmentDto, @CurrentUser() user: User) {
    return this.benefitsService.createEnrollment(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBenefitEnrollmentDto,
    @CurrentUser() user: User,
  ) {
    return this.benefitsService.updateEnrollment(id, dto, user.tenant_id);
  }

  @Patch(':id/terminate')
  terminate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('end_date') endDate: string,
    @CurrentUser() user: User,
  ) {
    return this.benefitsService.terminateEnrollment(id, endDate, user.tenant_id);
  }
}

@ApiTags('Payroll — Dependents')
@Controller('payroll/dependents')
export class DependentController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('employee_id') employeeId?: string) {
    return this.benefitsService.findDependents(
      employeeId ?? user.employee_id,
      user.tenant_id,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.benefitsService.findOneDependent(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateDependentDto, @CurrentUser() user: User) {
    return this.benefitsService.createDependent(dto, user.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDependentDto,
    @CurrentUser() user: User,
  ) {
    return this.benefitsService.updateDependent(id, dto, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.benefitsService.removeDependent(id, user.tenant_id);
  }
}
