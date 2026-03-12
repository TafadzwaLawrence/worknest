import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { SalaryRevisionService } from '../services/salary-revision.service.js';
import { CreateSalaryRevisionDto } from '../dto/hr-compliance.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('salary-revisions')
export class SalaryRevisionController {
  constructor(private readonly service: SalaryRevisionService) {}

  @Post()
  create(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateSalaryRevisionDto,
  ) {
    return this.service.create(user.tenant_id, user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { tenant_id: string; id: string }) {
    return this.service.findAll(user.tenant_id);
  }

  @Get('employee/:employeeId')
  findByEmployee(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.service.findByEmployee(user.tenant_id, employeeId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(user.tenant_id, id);
  }
}
