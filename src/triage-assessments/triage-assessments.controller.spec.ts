import { Test, TestingModule } from '@nestjs/testing';
import { TriageAssessmentsController } from './triage-assessments.controller';
import { TriageAssessmentsService } from './triage-assessments.service';

describe('TriageAssessmentsController', () => {
  let controller: TriageAssessmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TriageAssessmentsController],
      providers: [{ provide: TriageAssessmentsService, useValue: {} }],
    }).compile();

    controller = module.get<TriageAssessmentsController>(
      TriageAssessmentsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
