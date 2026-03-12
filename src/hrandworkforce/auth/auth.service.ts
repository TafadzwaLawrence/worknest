import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../core/entities/user.entity.js';
import { Tenant } from '../core/entities/tenant.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto, tenantId: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.email = :email AND user.tenant_id = :tenantId', {
        email: dto.email,
        tenantId,
      })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is disabled');
    }

    if (user.locked_until && user.locked_until > new Date()) {
      throw new UnauthorizedException(
        `Account locked until ${user.locked_until.toISOString()}`,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      await this.incrementFailedAttempts(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await this.userRepository.update(user.id, {
      failed_login_attempts: 0,
      locked_until: undefined,
      last_login_at: new Date(),
    });

    return this.generateTokens(user);
  }

  async register(dto: RegisterDto) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: dto.tenantId, is_active: true },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid or inactive tenant');
    }

    const existing = await this.userRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });

    if (existing) {
      throw new ConflictException('Email or username already in use');
    }

    const saltRounds = this.configService.get<number>('jwt.bcryptSaltRounds') ?? 12;
    const password_hash = await bcrypt.hash(dto.password, saltRounds);

    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      password_hash,
      tenant_id: dto.tenantId,
    });

    const saved = await this.userRepository.save(user);
    return this.generateTokens(saved);
  }

  private generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenant_id,
      isSuperAdmin: user.is_super_admin,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d') as any,
    });

    return { accessToken, refreshToken };
  }

  private async incrementFailedAttempts(user: User) {
    const attempts = user.failed_login_attempts + 1;
    const lockedUntil =
      attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : undefined;

    await this.userRepository
      .createQueryBuilder()
      .update()
      .set({ failed_login_attempts: attempts, locked_until: lockedUntil })
      .where('id = :id', { id: user.id })
      .execute();
  }
}
