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
import { CompensationService } from '../services/compensation.service.js';
import {
  CreatePayStructureDto,
  UpdatePayStructureDto,
  UpsertEmployeeTaxInfoDto,
  CreateTaxJurisdictionDto,
  UpdateTaxJurisdictionDto,
} from '../dto/payroll.dto.js';

@ApiTags('Payroll — Pay Structures')
@Controller('payroll/pay-structures')
export class PayStructureController {
  constructor(private readonly compensationService: CompensationService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query('employee_id') employeeId?: string) {
    return this.compensationService.findAllPayStructures(user.tenant_id, employeeId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.compensationService.findOnePayStructure(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreatePayStructureDto, @CurrentUser() user: User) {
    return this.compensationService.createPayStructure(dto, user.tenant_id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayStructureDto,
    @CurrentUser() user: User,
  ) {
    return this.compensationService.updatePayStructure(id, dto, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.compensationService.removePayStructure(id, user.tenant_id);
  }
}

@ApiTags('Payroll — Tax Info')
@Controller('payroll/tax-info')
export class EmployeeTaxInfoController {
  constructor(private readonly compensationService: CompensationService) {}

  @Get(':employeeId')
  findOne(@Param('employeeId', ParseUUIDPipe) employeeId: string, @CurrentUser() user: User) {
    return this.compensationService.findTaxInfo(employeeId, user.tenant_id);
  }

  @Post()
  upsert(@Body() dto: UpsertEmployeeTaxInfoDto, @CurrentUser() user: User) {
    return this.compensationService.upsertTaxInfo(dto, user.tenant_id);
  }
}

@ApiTags('Payroll — Tax Jurisdictions')
@Controller('payroll/tax-jurisdictions')
export class TaxJurisdictionController {
  constructor(private readonly compensationService: CompensationService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.compensationService.findAllJurisdictions(user.tenant_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.compensationService.findOneJurisdiction(id, user.tenant_id);
  }

  @Post()
  create(@Body() dto: CreateTaxJurisdictionDto, @CurrentUser() user: User) {
    return this.compensationService.createJurisdiction(dto, user.tenant_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaxJurisdictionDto,
    @CurrentUser() user: User,
  ) {
    return this.compensationService.updateJurisdiction(id, dto, user.tenant_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.compensationService.removeJurisdiction(id, user.tenant_id);
  }
}
