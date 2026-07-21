import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'Identificador del paciente',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsUUID('4', {
    message: 'El identificador del paciente debe ser un UUID válido',
  })
  patientId: string;

  @ApiProperty({
    description: 'Identificador del médico',
    example: '22222222-2222-2222-2222-222222222222',
  })
  @IsUUID('4', {
    message: 'El identificador del médico debe ser un UUID válido',
  })
  doctorId: string;

  @ApiProperty({
    description: 'Identificador del hospital',
    example: '33333333-3333-3333-3333-333333333333',
  })
  @IsUUID('4', {
    message: 'El identificador del hospital debe ser un UUID válido',
  })
  hospitalId: string;

  @ApiProperty({
    description: 'Identificador de la especialidad médica',
    example: '44444444-4444-4444-4444-444444444444',
  })
  @IsUUID('4', {
    message: 'El identificador de la especialidad debe ser un UUID válido',
  })
  specialtyId: string;

  @ApiProperty({
    description: 'Fecha y hora programadas para la cita',
    example: '2026-07-22T15:30:00-04:00',
  })
  @IsDateString(
    {},
    {
      message: 'La fecha y hora de la cita deben tener un formato válido',
    },
  )
  scheduledAt: string;

  @ApiProperty({
    description: 'Motivo principal de la consulta',
    example: 'Consulta por dolor de cabeza frecuente',
    maxLength: 500,
  })
  @IsString({
    message: 'El motivo de la consulta debe ser texto',
  })
  @IsNotEmpty({
    message: 'El motivo de la consulta es obligatorio',
  })
  @MaxLength(500, {
    message: 'El motivo de la consulta no puede superar los 500 caracteres',
  })
  reason: string;
}
