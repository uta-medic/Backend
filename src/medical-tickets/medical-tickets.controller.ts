import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CreateMedicalTicketDto } from './dto/create-medical-ticket.dto';
import { MedicalTicketQueueQueryDto } from './dto/medical-ticket-queue-query.dto';
import { MedicalTicket } from './entities/medical-ticket.entity';
import {
  MedicalTicketPosition,
  MedicalTicketsService,
} from './medical-tickets.service';

@ApiTags('Fichas médicas')
@Controller('medical-tickets')
export class MedicalTicketsController {
  constructor(private readonly medicalTicketsService: MedicalTicketsService) {}

  @Post()
  @ApiOperation({
    summary: 'Generar una ficha a partir de una evaluación revisada',
  })
  @ApiCreatedResponse({
    description: 'La ficha médica fue generada correctamente',
    type: MedicalTicket,
  })
  @ApiBadRequestResponse({
    description: 'La evaluación todavía no fue revisada o no tiene prioridad',
  })
  @ApiConflictResponse({
    description: 'La cita ya tiene una ficha médica',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró la evaluación o la cita relacionada',
  })
  create(@Body() createDto: CreateMedicalTicketDto): Promise<MedicalTicket> {
    return this.medicalTicketsService.create(createDto);
  }

  @Patch(':id/check-in')
  @ApiOperation({
    summary: 'Registrar la llegada del paciente y agregarlo a la cola',
  })
  @ApiOkResponse({
    description: 'El check-in fue registrado correctamente',
    type: MedicalTicket,
  })
  checkIn(@Param('id') id: string): Promise<MedicalTicket> {
    return this.medicalTicketsService.checkIn(id);
  }
  @Patch(':id/call')
  @ApiOperation({
    summary: 'Llamar al siguiente paciente en espera',
  })
  @ApiOkResponse({
    description: 'El paciente fue llamado correctamente',
    type: MedicalTicket,
  })
  @ApiBadRequestResponse({
    description: 'La ficha no se encuentra en espera',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró la ficha médica',
  })
  callPatient(@Param('id') id: string): Promise<MedicalTicket> {
    return this.medicalTicketsService.callPatient(id);
  }

  @Patch(':id/start-service')
  @ApiOperation({
    summary: 'Iniciar la atención médica del paciente',
  })
  @ApiOkResponse({
    description: 'La atención médica fue iniciada',
    type: MedicalTicket,
  })
  @ApiBadRequestResponse({
    description: 'El paciente todavía no fue llamado',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró la ficha médica',
  })
  startService(@Param('id') id: string): Promise<MedicalTicket> {
    return this.medicalTicketsService.startService(id);
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Finalizar la atención médica del paciente',
  })
  @ApiOkResponse({
    description: 'La atención médica fue completada',
    type: MedicalTicket,
  })
  @ApiBadRequestResponse({
    description: 'La atención no se encuentra en curso',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró la ficha médica',
  })
  completeService(@Param('id') id: string): Promise<MedicalTicket> {
    return this.medicalTicketsService.completeService(id);
  }

  @Patch(':id/no-show')
  @ApiOperation({
    summary: 'Marcar que el paciente llamado no se presentó',
  })
  @ApiOkResponse({
    description: 'La ficha fue marcada como no asistió',
    type: MedicalTicket,
  })
  @ApiBadRequestResponse({
    description: 'El paciente todavía no fue llamado',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró la ficha médica',
  })
  markNoShow(@Param('id') id: string): Promise<MedicalTicket> {
    return this.medicalTicketsService.markNoShow(id);
  }
  @Get('queue')
  @ApiOperation({
    summary: 'Obtener la cola ordenada de un centro y especialidad',
  })
  @ApiOkResponse({
    type: MedicalTicket,
    isArray: true,
  })
  findQueue(
    @Query() query: MedicalTicketQueueQueryDto,
  ): Promise<MedicalTicket[]> {
    return this.medicalTicketsService.findQueue(query);
  }

  @Get(':id/position')
  @ApiOperation({
    summary: 'Consultar la posición actual de una ficha',
  })
  @ApiOkResponse({
    schema: {
      example: {
        ticketId: 'A8792321-A8B4-F111-B337-002248E10E22',
        ticketNumber: 'F-20260725-33333333-44444444-0001',
        position: 1,
        totalWaiting: 1,
        hospitalId: '33333333-3333-4333-8333-333333333333',
        specialtyId: '44444444-4444-4444-8444-444444444444',
        ticketDate: '2026-07-25',
      },
    },
  })
  getPosition(@Param('id') id: string): Promise<MedicalTicketPosition> {
    return this.medicalTicketsService.getPosition(id);
  }
  @Get()
  @ApiOperation({
    summary: 'Obtener todas las fichas médicas',
  })
  @ApiOkResponse({
    description: 'Listado de fichas médicas registradas',
    type: MedicalTicket,
    isArray: true,
  })
  findAll(): Promise<MedicalTicket[]> {
    return this.medicalTicketsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una ficha por su identificador',
  })
  @ApiOkResponse({
    type: MedicalTicket,
  })
  findOne(@Param('id') id: string): Promise<MedicalTicket> {
    return this.medicalTicketsService.findOne(id);
  }
}
