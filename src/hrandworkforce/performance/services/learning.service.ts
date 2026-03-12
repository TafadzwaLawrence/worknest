import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity.js';
import { CourseModule } from '../entities/course-module.entity.js';
import { CourseContent } from '../entities/course-content.entity.js';
import { CourseEnrollment } from '../entities/course-enrollment.entity.js';
import { LearningPath } from '../entities/learning-path.entity.js';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CreateCourseModuleDto,
  UpdateCourseModuleDto,
  CreateCourseContentDto,
  UpdateCourseContentDto,
  CreateCourseEnrollmentDto,
  UpdateCourseEnrollmentDto,
  CreateLearningPathDto,
  UpdateLearningPathDto,
} from '../dto/performance.dto.js';

@Injectable()
export class LearningService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CourseModule)
    private readonly courseModuleRepo: Repository<CourseModule>,
    @InjectRepository(CourseContent)
    private readonly courseContentRepo: Repository<CourseContent>,
    @InjectRepository(CourseEnrollment)
    private readonly enrollmentRepo: Repository<CourseEnrollment>,
    @InjectRepository(LearningPath)
    private readonly learningPathRepo: Repository<LearningPath>,
  ) {}

  // ─── Courses ─────────────────────────────────────────────────────────────────

  async createCourse(tenantId: string, dto: CreateCourseDto, userId: string): Promise<Course> {
    const course = this.courseRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.courseRepo.save(course);
  }

  async findAllCourses(tenantId: string): Promise<Course[]> {
    return this.courseRepo.find({ where: { tenant_id: tenantId }, order: { title: 'ASC' } });
  }

  async findCourse(tenantId: string, id: string): Promise<Course> {
    const course = await this.courseRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async updateCourse(tenantId: string, id: string, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.findCourse(tenantId, id);
    Object.assign(course, dto);
    return this.courseRepo.save(course);
  }

  async removeCourse(tenantId: string, id: string): Promise<void> {
    const course = await this.findCourse(tenantId, id);
    await this.courseRepo.softRemove(course);
  }

  // ─── Course Modules ───────────────────────────────────────────────────────────

  async createModule(tenantId: string, dto: CreateCourseModuleDto): Promise<CourseModule> {
    const mod = this.courseModuleRepo.create({ ...dto, tenant_id: tenantId });
    return this.courseModuleRepo.save(mod);
  }

  async findModulesByCourse(courseId: string): Promise<CourseModule[]> {
    return this.courseModuleRepo.find({ where: { course_id: courseId }, order: { order_index: 'ASC' } });
  }

  async findModule(id: string): Promise<CourseModule> {
    const mod = await this.courseModuleRepo.findOne({ where: { id } });
    if (!mod) throw new NotFoundException('Course module not found');
    return mod;
  }

  async updateModule(id: string, dto: UpdateCourseModuleDto): Promise<CourseModule> {
    const mod = await this.findModule(id);
    Object.assign(mod, dto);
    return this.courseModuleRepo.save(mod);
  }

  async removeModule(id: string): Promise<void> {
    const mod = await this.findModule(id);
    await this.courseModuleRepo.remove(mod);
  }

  // ─── Course Content ───────────────────────────────────────────────────────────

  async createContent(tenantId: string, dto: CreateCourseContentDto): Promise<CourseContent> {
    const content = this.courseContentRepo.create({ ...dto, tenant_id: tenantId });
    return this.courseContentRepo.save(content);
  }

  async findContentByModule(moduleId: string): Promise<CourseContent[]> {
    return this.courseContentRepo.find({ where: { module_id: moduleId }, order: { order_index: 'ASC' } });
  }

  async findContent(id: string): Promise<CourseContent> {
    const c = await this.courseContentRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Course content not found');
    return c;
  }

  async updateContent(id: string, dto: UpdateCourseContentDto): Promise<CourseContent> {
    const c = await this.findContent(id);
    Object.assign(c, dto);
    return this.courseContentRepo.save(c);
  }

  async removeContent(id: string): Promise<void> {
    const c = await this.findContent(id);
    await this.courseContentRepo.remove(c);
  }

  // ─── Enrollments ─────────────────────────────────────────────────────────────

  async enroll(tenantId: string, dto: CreateCourseEnrollmentDto, userId: string): Promise<CourseEnrollment> {
    const existing = await this.enrollmentRepo.findOne({
      where: { employee_id: dto.employee_id, course_id: dto.course_id },
    });
    if (existing) throw new ConflictException('Employee already enrolled in this course');
    const enrollment = this.enrollmentRepo.create({
      ...dto,
      tenant_id: tenantId,
      enrolled_by: userId,
      enrolled_at: new Date(),
    });
    return this.enrollmentRepo.save(enrollment);
  }

  async findAllEnrollments(tenantId: string, employeeId?: string): Promise<CourseEnrollment[]> {
    const where: Record<string, unknown> = { tenant_id: tenantId };
    if (employeeId) where.employee_id = employeeId;
    return this.enrollmentRepo.find({ where, order: { enrolled_at: 'DESC' } });
  }

  async findEnrollment(id: string): Promise<CourseEnrollment> {
    const e = await this.enrollmentRepo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Enrollment not found');
    return e;
  }

  async updateEnrollment(id: string, dto: UpdateCourseEnrollmentDto): Promise<CourseEnrollment> {
    const e = await this.findEnrollment(id);
    Object.assign(e, dto);
    return this.enrollmentRepo.save(e);
  }

  // ─── Learning Paths ───────────────────────────────────────────────────────────

  async createLearningPath(tenantId: string, dto: CreateLearningPathDto, userId: string): Promise<LearningPath> {
    const path = this.learningPathRepo.create({ ...dto, tenant_id: tenantId, created_by: userId });
    return this.learningPathRepo.save(path);
  }

  async findAllLearningPaths(tenantId: string): Promise<LearningPath[]> {
    return this.learningPathRepo.find({ where: { tenant_id: tenantId }, order: { name: 'ASC' } });
  }

  async findLearningPath(tenantId: string, id: string): Promise<LearningPath> {
    const path = await this.learningPathRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!path) throw new NotFoundException('Learning path not found');
    return path;
  }

  async updateLearningPath(tenantId: string, id: string, dto: UpdateLearningPathDto): Promise<LearningPath> {
    const path = await this.findLearningPath(tenantId, id);
    Object.assign(path, dto);
    return this.learningPathRepo.save(path);
  }

  async removeLearningPath(tenantId: string, id: string): Promise<void> {
    const path = await this.findLearningPath(tenantId, id);
    await this.learningPathRepo.softRemove(path);
  }
}
