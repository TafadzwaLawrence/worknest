import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CompetencyService } from '../services/competency.service.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import {
  CreateCompetencyFrameworkDto,
  UpdateCompetencyFrameworkDto,
  CreateCompetencyDto,
  UpdateCompetencyDto,
  CreateEmployeeCompetencyDto,
  UpdateEmployeeCompetencyDto,
  CreateSkillDto,
  UpdateSkillDto,
  CreateEmployeeSkillDto,
  UpdateEmployeeSkillDto,
} from '../dto/performance.dto.js';

@Controller('performance/competencies')
export class CompetencyController {
  constructor(private readonly competencyService: CompetencyService) {}

  // ─── Frameworks ─────────────────────────────────────────────────────────────

  @Post('frameworks')
  createFramework(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateCompetencyFrameworkDto,
  ) {
    return this.competencyService.createFramework(user.tenant_id, dto, user.id);
  }

  @Get('frameworks')
  findAllFrameworks(@CurrentUser() user: { tenant_id: string }) {
    return this.competencyService.findAllFrameworks(user.tenant_id);
  }

  @Get('frameworks/:id')
  findFramework(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.competencyService.findFramework(user.tenant_id, id);
  }

  @Put('frameworks/:id')
  updateFramework(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompetencyFrameworkDto,
  ) {
    return this.competencyService.updateFramework(user.tenant_id, id, dto);
  }

  @Delete('frameworks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFramework(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.competencyService.removeFramework(user.tenant_id, id);
  }

  // ─── Competencies ────────────────────────────────────────────────────────────

  @Post()
  createCompetency(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateCompetencyDto,
  ) {
    return this.competencyService.createCompetency(user.tenant_id, dto, user.id);
  }

  @Get()
  findAllCompetencies(
    @CurrentUser() user: { tenant_id: string },
    @Query('frameworkId') frameworkId?: string,
  ) {
    return this.competencyService.findAllCompetencies(user.tenant_id, frameworkId);
  }

  @Get(':id')
  findCompetency(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.competencyService.findCompetency(user.tenant_id, id);
  }

  @Put(':id')
  updateCompetency(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompetencyDto,
  ) {
    return this.competencyService.updateCompetency(user.tenant_id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCompetency(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.competencyService.removeCompetency(user.tenant_id, id);
  }

  // ─── Employee Competencies ───────────────────────────────────────────────────

  @Post('employees')
  addEmployeeCompetency(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: CreateEmployeeCompetencyDto,
  ) {
    return this.competencyService.addEmployeeCompetency(user.tenant_id, dto);
  }

  @Get('employees/:employeeId')
  findEmployeeCompetencies(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.competencyService.findEmployeeCompetencies(user.tenant_id, employeeId);
  }

  @Put('employees/records/:id')
  updateEmployeeCompetency(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeCompetencyDto,
  ) {
    return this.competencyService.updateEmployeeCompetency(id, dto);
  }

  @Delete('employees/records/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeEmployeeCompetency(@Param('id', ParseUUIDPipe) id: string) {
    return this.competencyService.removeEmployeeCompetency(id);
  }

  // ─── Skills ──────────────────────────────────────────────────────────────────

  @Post('skills')
  createSkill(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateSkillDto,
  ) {
    return this.competencyService.createSkill(user.tenant_id, dto, user.id);
  }

  @Get('skills')
  findAllSkills(@CurrentUser() user: { tenant_id: string }) {
    return this.competencyService.findAllSkills(user.tenant_id);
  }

  @Get('skills/:id')
  findSkill(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.competencyService.findSkill(user.tenant_id, id);
  }

  @Put('skills/:id')
  updateSkill(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.competencyService.updateSkill(user.tenant_id, id, dto);
  }

  @Delete('skills/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSkill(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.competencyService.removeSkill(user.tenant_id, id);
  }

  // ─── Employee Skills ─────────────────────────────────────────────────────────

  @Post('skills/employees')
  addEmployeeSkill(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: CreateEmployeeSkillDto,
  ) {
    return this.competencyService.addEmployeeSkill(user.tenant_id, dto);
  }

  @Get('skills/employees/:employeeId')
  findEmployeeSkills(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.competencyService.findEmployeeSkills(user.tenant_id, employeeId);
  }

  @Put('skills/employees/records/:id')
  updateEmployeeSkill(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeSkillDto,
  ) {
    return this.competencyService.updateEmployeeSkill(id, dto);
  }

  @Delete('skills/employees/records/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeEmployeeSkill(@Param('id', ParseUUIDPipe) id: string) {
    return this.competencyService.removeEmployeeSkill(id);
  }
}
