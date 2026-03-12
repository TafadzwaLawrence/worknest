import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity.js';
import { Department } from './entities/department.entity.js';
import { Designation } from './entities/designation.entity.js';
import { WorkLocation } from './entities/work-location.entity.js';
import { Employee } from './entities/employee.entity.js';
import { User } from './entities/user.entity.js';
import { Role } from './entities/role.entity.js';
import { UserRole } from './entities/user-role.entity.js';
import { TenantService } from './services/tenant.service.js';
import { DepartmentService } from './services/department.service.js';
import { DesignationService } from './services/designation.service.js';
import { WorkLocationService } from './services/work-location.service.js';
import { EmployeeService } from './services/employee.service.js';
import { UserService } from './services/user.service.js';
import { RoleService } from './services/role.service.js';
import { TenantController } from './controllers/tenant.controller.js';
import { DepartmentController } from './controllers/department.controller.js';
import { DesignationController } from './controllers/designation.controller.js';
import { WorkLocationController } from './controllers/work-location.controller.js';
import { EmployeeController } from './controllers/employee.controller.js';
import { UserController } from './controllers/user.controller.js';
import { RoleController } from './controllers/role.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      Department,
      Designation,
      WorkLocation,
      Employee,
      User,
      Role,
      UserRole,
    ]),
  ],
  controllers: [
    TenantController,
    DepartmentController,
    DesignationController,
    WorkLocationController,
    EmployeeController,
    UserController,
    RoleController,
  ],
  providers: [
    TenantService,
    DepartmentService,
    DesignationService,
    WorkLocationService,
    EmployeeService,
    UserService,
    RoleService,
  ],
  exports: [TypeOrmModule, TenantService, EmployeeService, UserService, RoleService],
})
export class CoreModule {}
