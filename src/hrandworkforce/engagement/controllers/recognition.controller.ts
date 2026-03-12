import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RecognitionService } from '../services/recognition.service.js';
import {
  CreateRecognitionProgramDto,
  CreateRecognitionDto,
  CreateRewardsCatalogDto,
  RedeemRewardDto,
} from '../dto/engagement.dto.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';

@Controller('engagement/recognition')
export class RecognitionController {
  constructor(private readonly recognitionService: RecognitionService) {}

  @Post('programs')
  createProgram(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateRecognitionProgramDto,
  ) {
    return this.recognitionService.createProgram(user.tenant_id, dto, user.id);
  }

  @Get('programs')
  findAllPrograms(@CurrentUser() user: { tenant_id: string }) {
    return this.recognitionService.findAllPrograms(user.tenant_id);
  }

  @Post()
  createRecognition(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateRecognitionDto,
  ) {
    return this.recognitionService.createRecognition(user.tenant_id, dto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: { tenant_id: string }) {
    return this.recognitionService.findAllRecognitions(user.tenant_id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recognitionService.findRecognitionById(user.tenant_id, id);
  }

  @Patch(':id/approve')
  approve(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recognitionService.approveRecognition(user.tenant_id, id, user.id);
  }

  @Get('points/:employeeId')
  getPoints(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.recognitionService.getEmployeePoints(user.tenant_id, employeeId);
  }

  @Post('rewards')
  createReward(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateRewardsCatalogDto,
  ) {
    return this.recognitionService.createRewardsCatalog(user.tenant_id, dto, user.id);
  }

  @Get('rewards')
  findAllRewards(@CurrentUser() user: { tenant_id: string }) {
    return this.recognitionService.findAllRewards(user.tenant_id);
  }

  @Post('rewards/redeem')
  redeemReward(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: RedeemRewardDto,
  ) {
    return this.recognitionService.redeemReward(user.tenant_id, dto);
  }
}
