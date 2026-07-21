import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { TriagePriority } from '../enums/triage-priority.enum';

export class ReviewTriageAssessmentDto {
  @ApiProperty({
    description: 'Prioridad clínica asignada por el encargado médico',
    enum: TriagePriority,
    example: TriagePriority.HIGH,
  })
  @IsEnum(TriagePriority, {
    message: 'La prioridad debe ser low, medium, medium_high, high o very_high',
  })
  assignedPriority!: TriagePriority;

  @ApiProperty({
    description: 'Identificador del usuario médico que realizó la revisión',
    example: '55555555-5555-4555-8555-555555555555',
  })
  @Matches(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    {
      message:
        'El identificador del encargado médico debe tener un formato GUID válido',
    },
  )
  reviewedByUserId!: string;

  @ApiPropertyOptional({
    description: 'Observaciones realizadas durante la revisión médica',
    example: 'Se asigna prioridad alta después de la revisión médica',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({
    message: 'Las observaciones médicas deben ser texto',
  })
  @MaxLength(1000, {
    message: 'Las observaciones médicas no pueden superar los 1000 caracteres',
  })
  reviewNotes?: string;
}
