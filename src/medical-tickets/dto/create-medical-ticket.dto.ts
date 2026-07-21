import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, Matches } from 'class-validator';

import { PriorityPatientType } from '../enums/priority-patient-type.enum';

export class CreateMedicalTicketDto {
  @ApiProperty({
    description: 'Identificador de la evaluación de triaje revisada',
    example: 'A8792321-A8B4-F111-B337-002248E10E22',
  })
  @Matches(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    {
      message:
        'El identificador de la evaluación debe tener un formato GUID válido',
    },
  )
  triageAssessmentId!: string;

  @ApiPropertyOptional({
    description: 'Tipo de atención preferente del paciente',
    enum: PriorityPatientType,
    default: PriorityPatientType.NONE,
  })
  @IsOptional()
  @IsEnum(PriorityPatientType, {
    message: 'El tipo de atención preferente no es válido',
  })
  priorityPatientType?: PriorityPatientType;
}
