import { Injectable } from '@nestjs/common';
import { ClinicalContextService } from './clinical-context.service';
import { FoundryDoctorService } from './foundry-doctor.service';
import { AnalyzePatientDto } from './dto/analyze-patient.dto';

@Injectable()
export class DoctorAiService {
  constructor(
    private readonly clinicalContextService: ClinicalContextService,
    private readonly foundryDoctorService: FoundryDoctorService,
  ) {}

  async listPatients(doctorUserId: string) {
    const patients =
      await this.clinicalContextService.listAuthorizedPatients(doctorUserId);

    return {
      count: patients.length,
      patients,
    };
  }

  async analyzePatient(doctorUserId: string, dto: AnalyzePatientDto) {
    const context = await this.clinicalContextService.getAuthorizedContext(
      doctorUserId,
      dto.patientId,
    );

    const answer = await this.foundryDoctorService.analyze(
      context,
      dto.question,
    );

    return {
      patientId: dto.patientId,
      answer,
      generatedAt: new Date().toISOString(),
      disclaimer:
        'Resultado orientativo sujeto a revision del medico responsable.',
    };
  }
}
