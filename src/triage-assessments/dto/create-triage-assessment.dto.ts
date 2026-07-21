import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTriageAssessmentDto {
  @ApiProperty({
    description: 'Identificador de la cita médica',
    example: '086FB8B5-6B84-F111-B337-002248E10E22',
  })
  @Matches(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    {
      message: 'El identificador de la cita debe tener un formato GUID válido',
    },
  )
  appointmentId!: string;

  @ApiProperty({
    description: 'Síntomas declarados por el paciente',
    example: 'Dolor intenso de cabeza, mareos y náuseas',
    maxLength: 2000,
  })
  @IsString({
    message: 'Los síntomas deben ser texto',
  })
  @IsNotEmpty({
    message: 'Debe registrar los síntomas que presenta',
  })
  @MaxLength(2000, {
    message: 'Los síntomas no pueden superar los 2000 caracteres',
  })
  reportedSymptoms!: string;

  @ApiPropertyOptional({
    description: 'Información adicional proporcionada por el paciente',
    example: 'Los síntomas comenzaron esta mañana',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({
    message: 'Las observaciones adicionales deben ser texto',
  })
  @MaxLength(1000, {
    message:
      'Las observaciones adicionales no pueden superar los 1000 caracteres',
  })
  additionalNotes?: string;
}
