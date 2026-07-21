import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TriageAssessmentStatus } from '../enums/triage-assessment-status.enum';
import { TriagePriority } from '../enums/triage-priority.enum';

@Entity({ name: 'triage_assessments' })
@Index('UQ_triage_assessments_appointment', ['appointmentId'], {
  unique: true,
})
export class TriageAssessment {
  @ApiProperty({
    description: 'Identificador único de la evaluación',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Identificador de la cita relacionada',
  })
  @Column({ type: 'uniqueidentifier' })
  appointmentId!: string;

  @ApiProperty({
    description: 'Síntomas declarados por el paciente',
    example: 'Dolor intenso de cabeza, mareos y náuseas',
  })
  @Column({
    type: 'nvarchar',
    length: 2000,
  })
  reportedSymptoms!: string;

  @ApiProperty({
    description: 'Información adicional proporcionada por el paciente',
    nullable: true,
  })
  @Column({
    type: 'nvarchar',
    length: 1000,
    nullable: true,
  })
  additionalNotes!: string | null;

  @ApiProperty({
    description: 'Estado de revisión de la evaluación',
    enum: TriageAssessmentStatus,
  })
  @Column({
    type: 'nvarchar',
    length: 40,
    default: TriageAssessmentStatus.PENDING_REVIEW,
  })
  status!: TriageAssessmentStatus;

  @ApiProperty({
    description: 'Prioridad asignada por el encargado médico',
    enum: TriagePriority,
    nullable: true,
  })
  @Column({
    type: 'nvarchar',
    length: 30,
    nullable: true,
  })
  assignedPriority!: TriagePriority | null;

  @ApiProperty({
    description: 'Usuario médico que realizó la revisión',
    nullable: true,
  })
  @Column({
    type: 'uniqueidentifier',
    nullable: true,
  })
  reviewedByUserId!: string | null;

  @ApiProperty({
    description: 'Observaciones realizadas durante la revisión',
    nullable: true,
  })
  @Column({
    type: 'nvarchar',
    length: 1000,
    nullable: true,
  })
  reviewNotes!: string | null;

  @ApiProperty({
    description: 'Fecha en la que se realizó la revisión',
    nullable: true,
  })
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  reviewedAt!: Date | null;

  @CreateDateColumn({
    type: 'datetime2',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'datetime2',
  })
  updatedAt!: Date;
}
