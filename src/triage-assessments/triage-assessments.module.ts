import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from '../appointments/entities/appointment.entity';
import { GABO_DATABASE_CONNECTION } from '../config/database.constants';
import { TriageAssessment } from './entities/triage-assessment.entity';
import { TriageAssessmentsController } from './triage-assessments.controller';
import { TriageAssessmentsService } from './triage-assessments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [TriageAssessment, Appointment],
      GABO_DATABASE_CONNECTION,
    ),
  ],
  controllers: [TriageAssessmentsController],
  providers: [TriageAssessmentsService],
  exports: [TriageAssessmentsService],
})
export class TriageAssessmentsModule {}
