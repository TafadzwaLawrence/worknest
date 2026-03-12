import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../hrandworkforce/core/entities/tenant.entity.js';
import { Department } from '../hrandworkforce/core/entities/department.entity.js';
import { Designation } from '../hrandworkforce/core/entities/designation.entity.js';
import { WorkLocation } from '../hrandworkforce/core/entities/work-location.entity.js';
import { Employee } from '../hrandworkforce/core/entities/employee.entity.js';
import { User } from '../hrandworkforce/core/entities/user.entity.js';
import { Role } from '../hrandworkforce/core/entities/role.entity.js';
import { UserRole } from '../hrandworkforce/core/entities/user-role.entity.js';

const ENTITIES = [
  Tenant,
  Department,
  Designation,
  WorkLocation,
  Employee,
  User,
  Role,
  UserRole,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('database.url');

        if (!url) {
          throw new Error(
            'DATABASE_URL is not set. ' +
              'Copy .env.example to .env and add your Supabase connection string.',
          );
        }

        return {
          type: 'postgres',
          url,
          // Supabase requires SSL on all connections
          ssl: { rejectUnauthorized: false },
          entities: ENTITIES,
          // Schema is managed by Flyway SQL migrations — never auto-sync
          synchronize: false,
          logging: configService.get<string>('app.nodeEnv') === 'development',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
