import { PartialType } from '@nestjs/swagger';
import { CreateWorkLocationDto } from './create-work-location.dto.js';

export class UpdateWorkLocationDto extends PartialType(CreateWorkLocationDto) {}
