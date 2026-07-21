import { Test, TestingModule } from '@nestjs/testing';
import { MedicalTicketsService } from './medical-tickets.service';

describe('MedicalTicketsService', () => {
  let service: MedicalTicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicalTicketsService],
    }).compile();

    service = module.get<MedicalTicketsService>(MedicalTicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
