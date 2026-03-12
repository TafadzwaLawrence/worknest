import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ description: 'User ID to assign the role to' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Role ID to assign' })
  @IsUUID()
  roleId: string;
}
