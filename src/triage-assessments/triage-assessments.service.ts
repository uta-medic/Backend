import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment } from '../appointments/entities/appointment.entity';
import { CreateTriageAssessmentDto } from './dto/create-triage-assessment.dto';
import { ReviewTriageAssessmentDto } from './dto/review-triage-assessment.dto';
import { TriageAssessment } from './entities/triage-assessment.entity';
import { TriageAssessmentStatus } from './enums/triage-assessment-status.enum';

@Injectable()
export class TriageAssessmentsService {
  constructor(
    @InjectRepository(TriageAssessment)
    private readonly triageRepository: Repository<TriageAssessment>,

    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  async create(
    createDto: CreateTriageAssessmentDto,
  ): Promise<TriageAssessment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: {
        id: createDto.appointmentId,
      },
    });

    if (!appointment) {
      throw new NotFoundException('No se encontró la cita médica relacionada');
    }

    const existingAssessment = await this.triageRepository.findOne({
      where: {
        appointmentId: createDto.appointmentId,
      },
    });

    if (existingAssessment) {
      throw new ConflictException(
        'La cita ya tiene una evaluación de síntomas registrada',
      );
    }

    const assessment = this.triageRepository.create({
      appointmentId: createDto.appointmentId,
      reportedSymptoms: createDto.reportedSymptoms,
      additionalNotes: createDto.additionalNotes ?? null,
      status: TriageAssessmentStatus.PENDING_REVIEW,
      assignedPriority: null,
      reviewedByUserId: null,
      reviewNotes: null,
      reviewedAt: null,
    });

    return this.triageRepository.save(assessment);
  }

  async findPending(): Promise<TriageAssessment[]> {
    return this.triageRepository.find({
      where: {
        status: TriageAssessmentStatus.PENDING_REVIEW,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async findAll(): Promise<TriageAssessment[]> {
    return this.triageRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<TriageAssessment> {
    const assessment = await this.triageRepository.findOne({
      where: { id },
    });

    if (!assessment) {
      throw new NotFoundException(
        `No se encontró una evaluación con el identificador ${id}`,
      );
    }

    return assessment;
  }

  async review(
    id: string,
    reviewDto: ReviewTriageAssessmentDto,
  ): Promise<TriageAssessment> {
    const assessment = await this.findOne(id);

    if (assessment.status === TriageAssessmentStatus.CANCELLED) {
      throw new BadRequestException(
        'No se puede revisar una evaluación cancelada',
      );
    }

    if (assessment.status === TriageAssessmentStatus.REVIEWED) {
      throw new BadRequestException('La evaluación ya fue revisada');
    }

    assessment.assignedPriority = reviewDto.assignedPriority;

    assessment.reviewedByUserId = reviewDto.reviewedByUserId;

    assessment.reviewNotes = reviewDto.reviewNotes ?? null;

    assessment.reviewedAt = new Date();
    assessment.status = TriageAssessmentStatus.REVIEWED;

    return this.triageRepository.save(assessment);
  }
}
