import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { GABO_DATABASE_CONNECTION } from '../config/database.constants';
import { TriageAssessment } from '../triage-assessments/entities/triage-assessment.entity';
import { MedicalTicket } from './entities/medical-ticket.entity';
import { MedicalTicketsService } from './medical-tickets.service';

describe('MedicalTicketsService', () => {
  let service: MedicalTicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalTicketsService,
        {
          provide: getRepositoryToken(
            MedicalTicket,
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
        {
          provide: getRepositoryToken(
            TriageAssessment,
            GABO_DATABASE_CONNECTION,
          ),
          useValue: {},
        },
        {
          provide: getDataSourceToken(GABO_DATABASE_CONNECTION),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MedicalTicketsService>(MedicalTicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
