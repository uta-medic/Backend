import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from '../appointments/entities/appointment.entity';
import { TriageAssessment } from '../triage-assessments/entities/triage-assessment.entity';
import { MedicalTicket } from './entities/medical-ticket.entity';
import { MedicalTicketsController } from './medical-tickets.controller';
import { MedicalTicketsService } from './medical-tickets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalTicket, Appointment, TriageAssessment]),
  ],
  controllers: [MedicalTicketsController],
  providers: [MedicalTicketsService],
  exports: [MedicalTicketsService],
})
export class MedicalTicketsModule {}
