import { PartialType } from '@nestjs/swagger';
import { CreateWorkflowStepDto } from './create-workflow-step.dto.js';

export class UpdateWorkflowStepDto extends PartialType(CreateWorkflowStepDto) {}
