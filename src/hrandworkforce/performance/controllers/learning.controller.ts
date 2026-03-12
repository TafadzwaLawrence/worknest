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
import { LearningService } from '../services/learning.service.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
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

@Controller('performance/learning')
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  // ─── Courses ─────────────────────────────────────────────────────────────────

  @Post('courses')
  createCourse(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateCourseDto,
  ) {
    return this.learningService.createCourse(user.tenant_id, dto, user.id);
  }

  @Get('courses')
  findAllCourses(@CurrentUser() user: { tenant_id: string }) {
    return this.learningService.findAllCourses(user.tenant_id);
  }

  @Get('courses/:id')
  findCourse(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.learningService.findCourse(user.tenant_id, id);
  }

  @Put('courses/:id')
  updateCourse(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.learningService.updateCourse(user.tenant_id, id, dto);
  }

  @Delete('courses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCourse(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.learningService.removeCourse(user.tenant_id, id);
  }

  // ─── Course Modules ───────────────────────────────────────────────────────────

  @Post('courses/:courseId/modules')
  createModule(
    @CurrentUser() user: { tenant_id: string },
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateCourseModuleDto,
  ) {
    return this.learningService.createModule(user.tenant_id, { ...dto, course_id: courseId });
  }

  @Get('courses/:courseId/modules')
  findModules(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.learningService.findModulesByCourse(courseId);
  }

  @Put('modules/:id')
  updateModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseModuleDto,
  ) {
    return this.learningService.updateModule(id, dto);
  }

  @Delete('modules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeModule(@Param('id', ParseUUIDPipe) id: string) {
    return this.learningService.removeModule(id);
  }

  // ─── Course Content ───────────────────────────────────────────────────────────

  @Post('modules/:moduleId/content')
  createContent(
    @CurrentUser() user: { tenant_id: string },
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: CreateCourseContentDto,
  ) {
    return this.learningService.createContent(user.tenant_id, { ...dto, module_id: moduleId });
  }

  @Get('modules/:moduleId/content')
  findContent(@Param('moduleId', ParseUUIDPipe) moduleId: string) {
    return this.learningService.findContentByModule(moduleId);
  }

  @Put('content/:id')
  updateContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseContentDto,
  ) {
    return this.learningService.updateContent(id, dto);
  }

  @Delete('content/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeContent(@Param('id', ParseUUIDPipe) id: string) {
    return this.learningService.removeContent(id);
  }

  // ─── Enrollments ─────────────────────────────────────────────────────────────

  @Post('enrollments')
  enroll(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateCourseEnrollmentDto,
  ) {
    return this.learningService.enroll(user.tenant_id, dto, user.id);
  }

  @Get('enrollments')
  findAllEnrollments(
    @CurrentUser() user: { tenant_id: string },
    @Query('employeeId') employeeId?: string,
  ) {
    return this.learningService.findAllEnrollments(user.tenant_id, employeeId);
  }

  @Get('enrollments/:id')
  findEnrollment(@Param('id', ParseUUIDPipe) id: string) {
    return this.learningService.findEnrollment(id);
  }

  @Put('enrollments/:id')
  updateEnrollment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseEnrollmentDto,
  ) {
    return this.learningService.updateEnrollment(id, dto);
  }

  // ─── Learning Paths ───────────────────────────────────────────────────────────

  @Post('paths')
  createLearningPath(
    @CurrentUser() user: { tenant_id: string; id: string },
    @Body() dto: CreateLearningPathDto,
  ) {
    return this.learningService.createLearningPath(user.tenant_id, dto, user.id);
  }

  @Get('paths')
  findAllLearningPaths(@CurrentUser() user: { tenant_id: string }) {
    return this.learningService.findAllLearningPaths(user.tenant_id);
  }

  @Get('paths/:id')
  findLearningPath(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.learningService.findLearningPath(user.tenant_id, id);
  }

  @Put('paths/:id')
  updateLearningPath(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLearningPathDto,
  ) {
    return this.learningService.updateLearningPath(user.tenant_id, id, dto);
  }

  @Delete('paths/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLearningPath(
    @CurrentUser() user: { tenant_id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.learningService.removeLearningPath(user.tenant_id, id);
  }
}
