import { Module } from '@nestjs/common';
import { MedicalTicketsService } from './medical-tickets.service';
import { MedicalTicketsController } from './medical-tickets.controller';

@Module({
  controllers: [MedicalTicketsController],
  providers: [MedicalTicketsService],
})
export class MedicalTicketsModule {}
