import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AppointmentStatus } from '../enums/appointment-status.enum';

@Entity({ name: 'appointments' })
@Index('UQ_appointments_doctor_scheduled_at', ['doctorId', 'scheduledAt'], {
  unique: true,
})
export class Appointment {
  @ApiProperty({
    description: 'Identificador único de la cita',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Identificador del paciente',
  })
  @Column({ type: 'uniqueidentifier' })
  patientId: string;

  @ApiProperty({
    description: 'Identificador del médico',
  })
  @Column({ type: 'uniqueidentifier' })
  doctorId: string;

  @ApiProperty({
    description: 'Identificador del hospital',
  })
  @Column({ type: 'uniqueidentifier' })
  hospitalId: string;

  @ApiProperty({
    description: 'Identificador de la especialidad',
  })
  @Column({ type: 'uniqueidentifier' })
  specialtyId: string;

  @ApiProperty({
    description: 'Fecha y hora programadas para la cita',
    example: '2026-07-22T15:30:00-04:00',
  })
  @Column({ type: 'datetime2' })
  scheduledAt: Date;

  @ApiProperty({
    description: 'Motivo de la consulta',
    example: 'Dolor de cabeza frecuente',
  })
  @Column({ type: 'nvarchar', length: 500 })
  reason: string;

  @ApiProperty({
    description: 'Estado actual de la cita',
    enum: AppointmentStatus,
    example: AppointmentStatus.SCHEDULED,
  })
  @Column({
    type: 'nvarchar',
    length: 30,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @ApiProperty({
    description: 'Motivo de cancelación',
    nullable: true,
  })
  @Column({
    type: 'nvarchar',
    length: 500,
    nullable: true,
  })
  cancellationReason: string | null;

  @ApiProperty({
    description: 'Fecha en la que se canceló la cita',
    nullable: true,
  })
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  cancelledAt: Date | null;

  @ApiProperty({
    description: 'Fecha de creación del registro',
  })
  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de la última modificación',
  })
  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;
}
