import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EssSettings } from '../entities/ess-settings.entity.js';
import { EssPortalPreferences } from '../entities/ess-portal-preferences.entity.js';
import { UpdateEssSettingsDto, UpsertPortalPreferencesDto } from '../dto/ess.dto.js';

@Injectable()
export class EssSettingsService {
  constructor(
    @InjectRepository(EssSettings)
    private readonly settingsRepo: Repository<EssSettings>,
    @InjectRepository(EssPortalPreferences)
    private readonly prefsRepo: Repository<EssPortalPreferences>,
  ) {}

  async getSettings(tenantId: string): Promise<EssSettings> {
    let settings = await this.settingsRepo.findOne({ where: { tenant_id: tenantId } });
    if (!settings) {
      settings = this.settingsRepo.create({ tenant_id: tenantId });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async updateSettings(tenantId: string, dto: UpdateEssSettingsDto): Promise<EssSettings> {
    const settings = await this.getSettings(tenantId);
    Object.assign(settings, dto);
    return this.settingsRepo.save(settings);
  }

  async getPreferences(tenantId: string, employeeId: string): Promise<EssPortalPreferences> {
    let prefs = await this.prefsRepo.findOne({
      where: { tenant_id: tenantId, employee_id: employeeId },
    });
    if (!prefs) {
      prefs = this.prefsRepo.create({ tenant_id: tenantId, employee_id: employeeId });
      prefs = await this.prefsRepo.save(prefs);
    }
    return prefs;
  }

  async upsertPreferences(tenantId: string, dto: UpsertPortalPreferencesDto): Promise<EssPortalPreferences> {
    let prefs = await this.prefsRepo.findOne({
      where: { tenant_id: tenantId, employee_id: dto.employee_id },
    });
    if (!prefs) {
      prefs = this.prefsRepo.create({ tenant_id: tenantId, ...dto });
    } else {
      Object.assign(prefs, dto);
    }
    return this.prefsRepo.save(prefs);
  }
}
