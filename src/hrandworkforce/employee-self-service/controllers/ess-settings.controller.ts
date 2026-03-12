import { Controller, Get, Patch, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { EssSettingsService } from '../services/ess-settings.service.js';
import { UpdateEssSettingsDto, UpsertPortalPreferencesDto } from '../dto/ess.dto.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';

@Controller('ess')
export class EssSettingsController {
  constructor(private readonly settingsService: EssSettingsService) {}

  @Get('settings')
  getSettings(@CurrentUser() user: { tenant_id: string }) {
    return this.settingsService.getSettings(user.tenant_id);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: UpdateEssSettingsDto,
  ) {
    return this.settingsService.updateSettings(user.tenant_id, dto);
  }

  @Get('preferences/:employeeId')
  getPreferences(
    @CurrentUser() user: { tenant_id: string },
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.settingsService.getPreferences(user.tenant_id, employeeId);
  }

  @Patch('preferences')
  upsertPreferences(
    @CurrentUser() user: { tenant_id: string },
    @Body() dto: UpsertPortalPreferencesDto,
  ) {
    return this.settingsService.upsertPreferences(user.tenant_id, dto);
  }
}
