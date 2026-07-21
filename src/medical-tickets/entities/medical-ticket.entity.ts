import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TriagePriority } from '../../triage-assessments/enums/triage-priority.enum';
import { MedicalTicketStatus } from '../enums/medical-ticket-status.enum';
import { PriorityPatientType } from '../enums/priority-patient-type.enum';

@Entity({ name: 'medical_tickets' })
@Index('UQ_medical_tickets_appointment', ['appointmentId'], {
  unique: true,
})
@Index('UQ_medical_tickets_triage', ['triageAssessmentId'], {
  unique: true,
})
@Index(
  'UQ_medical_tickets_daily_sequence',
  ['ticketDate', 'hospitalId', 'specialtyId', 'dailySequence'],
  {
    unique: true,
  },
)
export class MedicalTicket {
  @ApiProperty({
    description: 'Identificador único de la ficha médica',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Identificador de la cita relacionada',
  })
  @Column({
    type: 'uniqueidentifier',
  })
  appointmentId!: string;

  @ApiProperty({
    description: 'Identificador de la evaluación de triaje',
  })
  @Column({
    type: 'uniqueidentifier',
  })
  triageAssessmentId!: string;

  @ApiProperty({
    description: 'Identificador del centro médico',
  })
  @Column({
    type: 'uniqueidentifier',
  })
  hospitalId!: string;

  @ApiProperty({
    description: 'Identificador de la especialidad',
  })
  @Column({
    type: 'uniqueidentifier',
  })
  specialtyId!: string;

  @ApiProperty({
    description: 'Número visible de la ficha',
    example: 'F-20260721-001',
  })
  @Column({
    type: 'nvarchar',
    length: 40,
    unique: true,
  })
  ticketNumber!: string;

  @ApiProperty({
    description: 'Número secuencial de la ficha durante el día',
    example: 1,
  })
  @Column({
    type: 'int',
  })
  dailySequence!: number;

  @ApiProperty({
    description: 'Fecha operativa de la ficha',
    example: '2026-07-21',
  })
  @Column({
    type: 'date',
  })
  ticketDate!: string;

  @ApiProperty({
    description: 'Prioridad clínica asignada durante el triaje',
    enum: TriagePriority,
  })
  @Column({
    type: 'nvarchar',
    length: 30,
  })
  triagePriority!: TriagePriority;

  @ApiProperty({
    description: 'Tipo de atención preferente',
    enum: PriorityPatientType,
  })
  @Column({
    type: 'nvarchar',
    length: 40,
    default: PriorityPatientType.NONE,
  })
  priorityPatientType!: PriorityPatientType;

  @ApiProperty({
    description: 'Indica si el paciente tiene atención preferente',
    example: false,
  })
  @Column({
    type: 'bit',
    default: false,
  })
  hasPriorityCare!: boolean;

  @ApiProperty({
    description: 'Estado actual de la ficha',
    enum: MedicalTicketStatus,
  })
  @Column({
    type: 'nvarchar',
    length: 40,
    default: MedicalTicketStatus.READY_FOR_CHECK_IN,
  })
  status!: MedicalTicketStatus;

  @ApiProperty({
    description: 'Fecha y hora en que el paciente confirmó su llegada',
    nullable: true,
  })
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  checkedInAt!: Date | null;

  @ApiProperty({
    description: 'Fecha y hora en que se llamó al paciente',
    nullable: true,
  })
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  calledAt!: Date | null;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la atención',
    nullable: true,
  })
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  serviceStartedAt!: Date | null;

  @ApiProperty({
    description: 'Fecha y hora de finalización de la atención',
    nullable: true,
  })
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  completedAt!: Date | null;

  @CreateDateColumn({
    type: 'datetime2',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'datetime2',
  })
  updatedAt!: Date;
}
