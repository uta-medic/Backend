import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateTriageAssessmentDto {
  @ApiProperty({
    description: 'Identificador de la cita médica',
    example: '86cfb85c-6084-4111-8337-002248e102e2',
  })
  @IsUUID('4', {
    message: 'El identificador de la cita debe ser un UUID válido',
  })
  appointmentId: string;

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
  reportedSymptoms: string;

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
