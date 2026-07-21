import { Module } from '@nestjs/common';
import { ClinicalContextService } from './clinical-context.service';
import { DoctorAiController } from './doctor-ai.controller';
import { DoctorAiService } from './doctor-ai.service';
import { FoundryDoctorService } from './foundry-doctor.service';

@Module({
  controllers: [DoctorAiController],
  providers: [ClinicalContextService, FoundryDoctorService, DoctorAiService],
})
export class DoctorAiModule {}
