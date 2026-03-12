import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Applicant } from '../entities/applicant.entity.js';
import { ApplicantContact } from '../entities/applicant-contact.entity.js';
import { ApplicantDocument } from '../entities/applicant-document.entity.js';
import { CreateApplicantDto } from '../dto/create-applicant.dto.js';
import { CreateApplicantContactDto } from '../dto/application.dto.js';
import { PaginationDto } from '../../core/dto/pagination.dto.js';

@Injectable()
export class ApplicantService {
  constructor(
    @InjectRepository(Applicant)
    private readonly applicantRepo: Repository<Applicant>,
    @InjectRepository(ApplicantContact)
    private readonly contactRepo: Repository<ApplicantContact>,
    @InjectRepository(ApplicantDocument)
    private readonly documentRepo: Repository<ApplicantDocument>,
  ) {}

  async findAll(tenantId: string, { page = 1, limit = 20 }: PaginationDto) {
    const [data, total] = await this.applicantRepo.findAndCount({
      where: { tenant_id: tenantId, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Applicant> {
    const applicant = await this.applicantRepo.findOne({
      where: { id, tenant_id: tenantId, deleted_at: IsNull() },
    });
    if (!applicant) throw new NotFoundException(`Applicant ${id} not found`);
    return applicant;
  }

  async create(dto: CreateApplicantDto, tenantId: string, userId: string): Promise<Applicant> {
    if (dto.email) {
      const exists = await this.applicantRepo.findOne({
        where: { tenant_id: tenantId, email: dto.email, deleted_at: IsNull() },
      });
      if (exists) throw new ConflictException(`Applicant with email '${dto.email}' already exists`);
    }
    return this.applicantRepo.save(
      this.applicantRepo.create({ ...dto, tenant_id: tenantId, created_by: userId }),
    );
  }

  async update(id: string, dto: Partial<CreateApplicantDto>, tenantId: string, userId: string): Promise<Applicant> {
    const applicant = await this.findOne(id, tenantId);
    Object.assign(applicant, dto, { updated_by: userId });
    return this.applicantRepo.save(applicant);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const applicant = await this.findOne(id, tenantId);
    await this.applicantRepo.softRemove(applicant);
  }

  // ─── Contacts ────────────────────────────────────────────────────

  async getContacts(applicantId: string, tenantId: string): Promise<ApplicantContact[]> {
    await this.findOne(applicantId, tenantId);
    return this.contactRepo.find({ where: { applicant_id: applicantId, tenant_id: tenantId } });
  }

  async addContact(applicantId: string, dto: CreateApplicantContactDto, tenantId: string, userId: string): Promise<ApplicantContact> {
    await this.findOne(applicantId, tenantId);
    return this.contactRepo.save(
      this.contactRepo.create({ ...dto, applicant_id: applicantId, tenant_id: tenantId, created_by: userId }),
    );
  }

  async removeContact(applicantId: string, contactId: string, tenantId: string): Promise<void> {
    const contact = await this.contactRepo.findOne({
      where: { id: contactId, applicant_id: applicantId, tenant_id: tenantId },
    });
    if (!contact) throw new NotFoundException(`Contact ${contactId} not found`);
    await this.contactRepo.remove(contact);
  }

  // ─── Documents ───────────────────────────────────────────────────

  async getDocuments(applicantId: string, tenantId: string): Promise<ApplicantDocument[]> {
    await this.findOne(applicantId, tenantId);
    return this.documentRepo.find({ where: { applicant_id: applicantId, tenant_id: tenantId } });
  }
}
