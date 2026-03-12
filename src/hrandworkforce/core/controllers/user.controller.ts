import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { User } from '../entities/user.entity.js';
import { UpdateUserDto } from '../dto/user/update-user.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';
import { UserService } from '../services/user.service.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List all users for the current tenant' })
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.userService.findAll(user.tenant_id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id, user.tenant_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user (preferences, status)' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(id, dto, user.tenant_id);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a user account' })
  deactivate(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.userService.deactivate(id, user.tenant_id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a user account' })
  activate(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.userService.activate(id, user.tenant_id);
  }
}
