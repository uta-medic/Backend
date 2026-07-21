import { Test, TestingModule } from '@nestjs/testing';
import { TriageAssessmentsService } from './triage-assessments.service';

describe('TriageAssessmentsService', () => {
  let service: TriageAssessmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TriageAssessmentsService],
    }).compile();

    service = module.get<TriageAssessmentsService>(TriageAssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
