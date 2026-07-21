import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GABO_DATABASE_CONNECTION } from '../config/database.constants';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment, GABO_DATABASE_CONNECTION)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const scheduledAt = new Date(createAppointmentDto.scheduledAt);

    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'La fecha de la cita debe ser posterior a la fecha actual',
      );
    }

    const existingAppointment = await this.appointmentsRepository.findOne({
      where: {
        doctorId: createAppointmentDto.doctorId,
        scheduledAt,
      },
    });

    if (existingAppointment) {
      throw new ConflictException(
        'El médico ya tiene una cita registrada en ese horario',
      );
    }

    const appointment = this.appointmentsRepository.create({
      ...createAppointmentDto,
      scheduledAt,
      cancellationReason: null,
      cancelledAt: null,
    });

    return this.appointmentsRepository.save(appointment);
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      order: {
        scheduledAt: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(
        `No se encontró una cita con el identificador ${id}`,
      );
    }

    return appointment;
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (updateAppointmentDto.scheduledAt) {
      const scheduledAt = new Date(updateAppointmentDto.scheduledAt);

      if (scheduledAt.getTime() <= Date.now()) {
        throw new BadRequestException(
          'La fecha de la cita debe ser posterior a la fecha actual',
        );
      }

      appointment.scheduledAt = scheduledAt;
    }

    if (updateAppointmentDto.patientId) {
      appointment.patientId = updateAppointmentDto.patientId;
    }

    if (updateAppointmentDto.doctorId) {
      appointment.doctorId = updateAppointmentDto.doctorId;
    }

    if (updateAppointmentDto.hospitalId) {
      appointment.hospitalId = updateAppointmentDto.hospitalId;
    }

    if (updateAppointmentDto.specialtyId) {
      appointment.specialtyId = updateAppointmentDto.specialtyId;
    }

    if (updateAppointmentDto.reason) {
      appointment.reason = updateAppointmentDto.reason;
    }

    return this.appointmentsRepository.save(appointment);
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);

    await this.appointmentsRepository.remove(appointment);
  }
}
