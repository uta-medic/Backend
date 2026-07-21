import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Appointment } from '../appointments/entities/appointment.entity';
import { AppointmentStatus } from '../appointments/enums/appointment-status.enum';
import { TriageAssessment } from '../triage-assessments/entities/triage-assessment.entity';
import { TriageAssessmentStatus } from '../triage-assessments/enums/triage-assessment-status.enum';
import { TriagePriority } from '../triage-assessments/enums/triage-priority.enum';
import { CreateMedicalTicketDto } from './dto/create-medical-ticket.dto';
import { MedicalTicketQueueQueryDto } from './dto/medical-ticket-queue-query.dto';
import { MedicalTicket } from './entities/medical-ticket.entity';
import { MedicalTicketStatus } from './enums/medical-ticket-status.enum';
import { PriorityPatientType } from './enums/priority-patient-type.enum';

export interface MedicalTicketPosition {
  ticketId: string;
  ticketNumber: string;
  position: number;
  totalWaiting: number;
  hospitalId: string;
  specialtyId: string;
  ticketDate: string;
}

@Injectable()
export class MedicalTicketsService {
  constructor(
    @InjectRepository(MedicalTicket)
    private readonly ticketsRepository: Repository<MedicalTicket>,

    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,

    @InjectRepository(TriageAssessment)
    private readonly triageRepository: Repository<TriageAssessment>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createDto: CreateMedicalTicketDto): Promise<MedicalTicket> {
    return this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const triageRepository = manager.getRepository(TriageAssessment);

      const appointmentRepository = manager.getRepository(Appointment);

      const ticketRepository = manager.getRepository(MedicalTicket);

      const assessment = await triageRepository.findOne({
        where: {
          id: createDto.triageAssessmentId,
        },
      });

      if (!assessment) {
        throw new NotFoundException('No se encontró la evaluación de triaje');
      }

      if (assessment.status !== TriageAssessmentStatus.REVIEWED) {
        throw new BadRequestException(
          'La evaluación debe ser revisada antes de generar la ficha',
        );
      }

      if (!assessment.assignedPriority) {
        throw new BadRequestException(
          'La evaluación no tiene una prioridad clínica asignada',
        );
      }

      const appointment = await appointmentRepository.findOne({
        where: {
          id: assessment.appointmentId,
        },
      });

      if (!appointment) {
        throw new NotFoundException(
          'No se encontró la cita relacionada con la evaluación',
        );
      }

      const existingTicket = await ticketRepository.findOne({
        where: [
          {
            appointmentId: appointment.id,
          },
          {
            triageAssessmentId: assessment.id,
          },
        ],
      });

      if (existingTicket) {
        throw new ConflictException(
          'La cita ya tiene una ficha médica generada',
        );
      }

      const ticketDate = this.toDateOnly(appointment.scheduledAt);

      const sequenceResult = await ticketRepository
        .createQueryBuilder('ticket')
        .select('MAX(ticket.dailySequence)', 'maxSequence')
        .where('ticket.ticketDate = :ticketDate', {
          ticketDate,
        })
        .andWhere('ticket.hospitalId = :hospitalId', {
          hospitalId: appointment.hospitalId,
        })
        .andWhere('ticket.specialtyId = :specialtyId', {
          specialtyId: appointment.specialtyId,
        })
        .getRawOne<{
          maxSequence: number | string | null;
        }>();

      const dailySequence = Number(sequenceResult?.maxSequence ?? 0) + 1;

      const priorityPatientType =
        createDto.priorityPatientType ?? PriorityPatientType.NONE;

      const ticket = ticketRepository.create({
        appointmentId: appointment.id,
        triageAssessmentId: assessment.id,
        hospitalId: appointment.hospitalId,
        specialtyId: appointment.specialtyId,
        ticketDate,
        dailySequence,
        ticketNumber: this.buildTicketNumber(
          ticketDate,
          appointment.hospitalId,
          appointment.specialtyId,
          dailySequence,
        ),
        triagePriority: assessment.assignedPriority,
        priorityPatientType,
        hasPriorityCare: priorityPatientType !== PriorityPatientType.NONE,
        status: MedicalTicketStatus.READY_FOR_CHECK_IN,
        checkedInAt: null,
        calledAt: null,
        serviceStartedAt: null,
        completedAt: null,
      });

      return ticketRepository.save(ticket);
    });
  }

  async findOne(id: string): Promise<MedicalTicket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('No se encontró la ficha médica');
    }

    return ticket;
  }

  async checkIn(id: string): Promise<MedicalTicket> {
    return this.dataSource.transaction(async (manager) => {
      const ticketsRepository = manager.getRepository(MedicalTicket);

      const appointmentsRepository = manager.getRepository(Appointment);

      const ticket = await ticketsRepository.findOne({
        where: { id },
      });

      if (!ticket) {
        throw new NotFoundException('No se encontró la ficha médica');
      }

      if (ticket.status === MedicalTicketStatus.WAITING) {
        throw new BadRequestException(
          'El paciente ya realizó su registro de llegada',
        );
      }

      if (ticket.status !== MedicalTicketStatus.READY_FOR_CHECK_IN) {
        throw new BadRequestException(
          'La ficha no está disponible para registrar la llegada',
        );
      }

      const appointment = await appointmentsRepository.findOne({
        where: {
          id: ticket.appointmentId,
        },
      });

      if (!appointment) {
        throw new NotFoundException('No se encontró la cita relacionada');
      }

      ticket.status = MedicalTicketStatus.WAITING;
      ticket.checkedInAt = new Date();

      appointment.status = AppointmentStatus.WAITING;

      await appointmentsRepository.save(appointment);

      return ticketsRepository.save(ticket);
    });
  }
  async callPatient(id: string): Promise<MedicalTicket> {
    const ticket = await this.findOne(id);

    if (ticket.status !== MedicalTicketStatus.WAITING) {
      throw new BadRequestException(
        'Solo se puede llamar a un paciente que está en espera',
      );
    }

    ticket.status = MedicalTicketStatus.CALLED;
    ticket.calledAt = new Date();

    return this.ticketsRepository.save(ticket);
  }

  async startService(id: string): Promise<MedicalTicket> {
    return this.dataSource.transaction(async (manager) => {
      const ticketsRepository = manager.getRepository(MedicalTicket);

      const appointmentsRepository = manager.getRepository(Appointment);

      const ticket = await ticketsRepository.findOne({
        where: { id },
      });

      if (!ticket) {
        throw new NotFoundException('No se encontró la ficha médica');
      }

      if (ticket.status !== MedicalTicketStatus.CALLED) {
        throw new BadRequestException(
          'Solo se puede iniciar la atención de un paciente llamado',
        );
      }

      const appointment = await appointmentsRepository.findOne({
        where: {
          id: ticket.appointmentId,
        },
      });

      if (!appointment) {
        throw new NotFoundException('No se encontró la cita relacionada');
      }

      ticket.status = MedicalTicketStatus.IN_SERVICE;
      ticket.serviceStartedAt = new Date();

      appointment.status = AppointmentStatus.IN_PROGRESS;

      await appointmentsRepository.save(appointment);

      return ticketsRepository.save(ticket);
    });
  }

  async completeService(id: string): Promise<MedicalTicket> {
    return this.dataSource.transaction(async (manager) => {
      const ticketsRepository = manager.getRepository(MedicalTicket);

      const appointmentsRepository = manager.getRepository(Appointment);

      const ticket = await ticketsRepository.findOne({
        where: { id },
      });

      if (!ticket) {
        throw new NotFoundException('No se encontró la ficha médica');
      }

      if (ticket.status !== MedicalTicketStatus.IN_SERVICE) {
        throw new BadRequestException(
          'Solo se puede finalizar una atención que está en curso',
        );
      }

      const appointment = await appointmentsRepository.findOne({
        where: {
          id: ticket.appointmentId,
        },
      });

      if (!appointment) {
        throw new NotFoundException('No se encontró la cita relacionada');
      }

      ticket.status = MedicalTicketStatus.COMPLETED;
      ticket.completedAt = new Date();

      appointment.status = AppointmentStatus.COMPLETED;

      await appointmentsRepository.save(appointment);

      return ticketsRepository.save(ticket);
    });
  }

  async markNoShow(id: string): Promise<MedicalTicket> {
    return this.dataSource.transaction(async (manager) => {
      const ticketsRepository = manager.getRepository(MedicalTicket);

      const appointmentsRepository = manager.getRepository(Appointment);

      const ticket = await ticketsRepository.findOne({
        where: { id },
      });

      if (!ticket) {
        throw new NotFoundException('No se encontró la ficha médica');
      }

      if (ticket.status !== MedicalTicketStatus.CALLED) {
        throw new BadRequestException(
          'Solo puede marcarse como no asistió después de llamar al paciente',
        );
      }

      const appointment = await appointmentsRepository.findOne({
        where: {
          id: ticket.appointmentId,
        },
      });

      if (!appointment) {
        throw new NotFoundException('No se encontró la cita relacionada');
      }

      ticket.status = MedicalTicketStatus.NO_SHOW;

      appointment.status = AppointmentStatus.NO_SHOW;

      await appointmentsRepository.save(appointment);

      return ticketsRepository.save(ticket);
    });
  }

  async findQueue(query: MedicalTicketQueueQueryDto): Promise<MedicalTicket[]> {
    const ticketDate = query.ticketDate ?? this.toDateOnly(new Date());

    const tickets = await this.ticketsRepository
      .createQueryBuilder('ticket')
      .where('ticket.hospitalId = :hospitalId', {
        hospitalId: query.hospitalId,
      })
      .andWhere('ticket.specialtyId = :specialtyId', {
        specialtyId: query.specialtyId,
      })
      .andWhere('CONVERT(varchar(10), ticket.ticketDate, 23) = :ticketDate', {
        ticketDate,
      })
      .andWhere('ticket.status = :status', {
        status: MedicalTicketStatus.WAITING,
      })
      .getMany();

    return tickets.sort((first, second) =>
      this.compareQueueTickets(first, second),
    );
  }

  async getPosition(id: string): Promise<MedicalTicketPosition> {
    const ticket = await this.findOne(id);

    if (ticket.status === MedicalTicketStatus.READY_FOR_CHECK_IN) {
      throw new BadRequestException(
        'El paciente debe realizar el check-in antes de consultar su posición',
      );
    }

    if (ticket.status !== MedicalTicketStatus.WAITING) {
      throw new BadRequestException(
        'La ficha no se encuentra actualmente en la cola de espera',
      );
    }

    const queue = await this.findQueue({
      hospitalId: ticket.hospitalId,
      specialtyId: ticket.specialtyId,
      ticketDate: ticket.ticketDate,
    });

    const index = queue.findIndex(
      (queueTicket) => queueTicket.id === ticket.id,
    );

    if (index === -1) {
      throw new NotFoundException('La ficha no se encontró en la cola activa');
    }

    return {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      position: index + 1,
      totalWaiting: queue.length,
      hospitalId: ticket.hospitalId,
      specialtyId: ticket.specialtyId,
      ticketDate: ticket.ticketDate,
    };
  }
  async findAll(): Promise<MedicalTicket[]> {
    return this.ticketsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  private compareQueueTickets(
    first: MedicalTicket,
    second: MedicalTicket,
  ): number {
    const priorityDifference =
      this.getPriorityWeight(second.triagePriority) -
      this.getPriorityWeight(first.triagePriority);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    if (first.hasPriorityCare !== second.hasPriorityCare) {
      return first.hasPriorityCare ? -1 : 1;
    }

    const firstCheckIn =
      first.checkedInAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

    const secondCheckIn =
      second.checkedInAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (firstCheckIn !== secondCheckIn) {
      return firstCheckIn - secondCheckIn;
    }

    return first.dailySequence - second.dailySequence;
  }

  private getPriorityWeight(priority: TriagePriority): number {
    const weights: Record<TriagePriority, number> = {
      [TriagePriority.LOW]: 1,
      [TriagePriority.MEDIUM]: 2,
      [TriagePriority.MEDIUM_HIGH]: 3,
      [TriagePriority.HIGH]: 4,
      [TriagePriority.VERY_HIGH]: 5,
    };

    return weights[priority];
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private buildTicketNumber(
    ticketDate: string,
    hospitalId: string,
    specialtyId: string,
    dailySequence: number,
  ): string {
    const datePart = ticketDate.replaceAll('-', '');

    const hospitalPart = hospitalId
      .replaceAll('-', '')
      .slice(0, 8)
      .toUpperCase();

    const specialtyPart = specialtyId
      .replaceAll('-', '')
      .slice(0, 8)
      .toUpperCase();

    const sequencePart = String(dailySequence).padStart(4, '0');

    return `F-${datePart}-${hospitalPart}-${specialtyPart}-${sequencePart}`;
  }
}
