import { Test, TestingModule } from '@nestjs/testing';
import { MedicalTicketsController } from './medical-tickets.controller';
import { MedicalTicketsService } from './medical-tickets.service';

describe('MedicalTicketsController', () => {
  let controller: MedicalTicketsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicalTicketsController],
      providers: [{ provide: MedicalTicketsService, useValue: {} }],
    }).compile();

    controller = module.get<MedicalTicketsController>(MedicalTicketsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
