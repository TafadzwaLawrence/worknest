import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Holiday } from '../entities/holiday.entity';
import { CreateHolidayDto, UpdateHolidayDto } from '../dto/time-attendance.dto';

@Injectable()
export class HolidayService {
  constructor(
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
  ) {}

  findAll(tenantId: string, year?: number) {
    const qb = this.holidayRepo
      .createQueryBuilder('h')
      .where('h.tenant_id = :tenantId', { tenantId })
      .orderBy('h.date', 'ASC');
    if (year) qb.andWhere('EXTRACT(YEAR FROM h.date::date) = :year', { year });
    return qb.getMany();
  }

  async findOne(id: string, tenantId: string) {
    const h = await this.holidayRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!h) throw new NotFoundException('Holiday not found');
    return h;
  }

  create(dto: CreateHolidayDto, tenantId: string) {
    return this.holidayRepo.save(this.holidayRepo.create({ ...dto, tenant_id: tenantId }));
  }

  async update(id: string, dto: UpdateHolidayDto, tenantId: string) {
    const h = await this.findOne(id, tenantId);
    Object.assign(h, dto);
    return this.holidayRepo.save(h);
  }

  async remove(id: string, tenantId: string) {
    const h = await this.findOne(id, tenantId);
    return this.holidayRepo.remove(h);
  }
}
