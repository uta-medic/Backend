import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, Matches } from 'class-validator';

export class MedicalTicketQueueQueryDto {
  @ApiProperty({
    description: 'Identificador del centro médico',
  })
  @Matches(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    {
      message: 'El identificador del centro debe ser un GUID válido',
    },
  )
  hospitalId!: string;

  @ApiProperty({
    description: 'Identificador de la especialidad',
  })
  @Matches(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    {
      message: 'El identificador de la especialidad debe ser un GUID válido',
    },
  )
  specialtyId!: string;

  @ApiPropertyOptional({
    description: 'Fecha de la cola. Si se omite se utilizará la fecha actual',
    example: '2026-07-25',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'La fecha de la cola debe tener formato YYYY-MM-DD',
    },
  )
  ticketDate?: string;
}
