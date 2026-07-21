import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { GABO_DATABASE_CONNECTION } from '../config/database.constants';
import { TriageAssessment } from './entities/triage-assessment.entity';
import { TriageAssessmentsService } from './triage-assessments.service';

describe('TriageAssessmentsService', () => {
  let service: TriageAssessmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TriageAssessmentsService,
        {
          provide: getRepositoryToken(
            TriageAssessment,
            GABO_DATABASE_CONNECTION,
          ),
          useValue: {},
        },
        {
          provide: getRepositoryToken(
            Appointment,
            GABO_DATABASE_CONNECTION,
          ),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TriageAssessmentsService>(TriageAssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
