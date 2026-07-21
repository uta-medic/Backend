import { PartialType } from '@nestjs/swagger';
import { CreateTriageAssessmentDto } from './create-triage-assessment.dto';

export class UpdateTriageAssessmentDto extends PartialType(
  CreateTriageAssessmentDto,
) {}
