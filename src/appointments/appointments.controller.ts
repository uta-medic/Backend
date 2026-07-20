import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';

@ApiTags('Citas médicas')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar una nueva cita médica',
  })
  @ApiCreatedResponse({
    description: 'La cita fue registrada correctamente',
    type: Appointment,
  })
  @ApiBadRequestResponse({
    description: 'Los datos enviados no son válidos',
  })
  @ApiConflictResponse({
    description: 'El médico ya tiene una cita registrada en ese horario',
  })
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las citas médicas',
  })
  @ApiOkResponse({
    description: 'Listado de citas médicas',
    type: Appointment,
    isArray: true,
  })
  findAll(): Promise<Appointment[]> {
    return this.appointmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una cita médica por su identificador',
  })
  @ApiOkResponse({
    description: 'Información de la cita médica',
    type: Appointment,
  })
  @ApiNotFoundResponse({
    description: 'No se encontró la cita médica',
  })
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    id: string,
  ): Promise<Appointment> {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una cita médica',
  })
  @ApiOkResponse({
    description: 'La cita fue actualizada correctamente',
    type: Appointment,
  })
  @ApiNotFoundResponse({
    description: 'No se encontró la cita médica',
  })
  update(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una cita médica',
  })
  @ApiNoContentResponse({
    description: 'La cita fue eliminada correctamente',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró la cita médica',
  })
  remove(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    id: string,
  ): Promise<void> {
    return this.appointmentsService.remove(id);
  }
}
