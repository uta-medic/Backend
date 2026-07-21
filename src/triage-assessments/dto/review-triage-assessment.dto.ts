import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
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
    message: 'La prioridad debe ser leve, media, media-alta, alta o muy alta',
  })
  assignedPriority: TriagePriority;

  @ApiProperty({
    description: 'Identificador del usuario médico que realizó la revisión',
    example: '55555555-5555-4555-8555-555555555555',
  })
  @IsUUID('4', {
    message: 'El identificador del encargado médico debe ser un UUID válido',
  })
  reviewedByUserId: string;

  @ApiPropertyOptional({
    description: 'Observaciones del encargado médico',
    example:
      'El paciente requiere atención prioritaria por la intensidad de los síntomas',
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
