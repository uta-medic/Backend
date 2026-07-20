import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

export interface ClinicalContext {
  patient: {
    id: string;
    fullName: string;
    approximateAge: number;
    sex: string;
    bloodType: string | null;
  };
  encounter: {
    id: string | null;
    reason: string | null;
    symptoms: string | null;
    diagnosis: string | null;
    treatment: string | null;
    clinicalNotes: string | null;
    status: string | null;
    startedAt: Date | null;
  };
  vitalSigns: {
    temperature: number | null;
    systolicPressure: number | null;
    diastolicPressure: number | null;
    heartRate: number | null;
    respiratoryRate: number | null;
    oxygenSaturation: number | null;
  } | null;
  allergies: Array<{
    name: string;
    reaction: string | null;
    severity: string | null;
  }>;
  laboratoryResults: Array<{
    testName: string;
    resultValue: string;
    unit: string | null;
    referenceRange: string | null;
    status: string;
    performedAt: Date;
  }>;
}

export interface PatientSummary {
  patientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  approximateAge: number;
  sex: string;
  bloodType: string | null;
  documentCode: string;
  phone: string | null;
  assignedAt: Date;
  lastEncounter: {
    reason: string | null;
    status: string | null;
    startedAt: Date | null;
  };
}

interface DoctorRow {
  id: string;
}

interface PatientRow {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  sex: string;
  blood_type: string | null;
  document_code: string;
  phone: string | null;
}

interface AssignmentRow {
  patient_id: string;
  assigned_at: string;
}

interface EncounterRow {
  id: string;
  patient_id: string;
  reason: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  clinical_notes: string | null;
  status: string | null;
  started_at: string | null;
}

interface VitalSignsRow {
  temperature: number | null;
  systolic_pressure: number | null;
  diastolic_pressure: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
}

interface PatientAllergyRow {
  allergy_id: string;
  reaction: string | null;
  severity: string | null;
}

interface AllergyRow {
  id: string;
  name: string;
}

interface LabResultRow {
  test_name: string;
  result_value: string;
  unit: string | null;
  reference_range: string | null;
  status: string;
  performed_at: string;
}

@Injectable()
export class ClinicalContextService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listAuthorizedPatients(
    doctorUserId: string,
  ): Promise<PatientSummary[]> {
    const doctorId = await this.findDoctorId(doctorUserId);

    if (!doctorId) {
      throw new ForbiddenException(
        'El medico no existe o no tiene acceso autorizado.',
      );
    }

    const { data: assignments, error: assignmentsError } =
      await this.supabaseService
        .getClient()
        .from('doctor_patient_assignments')
        .select('patient_id, assigned_at')
        .eq('doctor_id', doctorId)
        .eq('active', true);

    this.throwIfSupabaseError(assignmentsError);

    const assignmentRows = (assignments ?? []) as AssignmentRow[];
    const patientIds = assignmentRows.map(
      (assignment) => assignment.patient_id,
    );

    if (patientIds.length === 0) {
      return [];
    }

    const [patientsResult, encountersResult] = await Promise.all([
      this.supabaseService
        .getClient()
        .from('patients')
        .select(
          'id, first_name, last_name, birth_date, sex, blood_type, document_code, phone',
        )
        .in('id', patientIds),
      this.supabaseService
        .getClient()
        .from('medical_encounters')
        .select('patient_id, reason, status, started_at')
        .eq('doctor_id', doctorId)
        .in('patient_id', patientIds)
        .order('started_at', { ascending: false }),
    ]);

    this.throwIfSupabaseError(patientsResult.error);
    this.throwIfSupabaseError(encountersResult.error);

    const assignmentsByPatient = new Map(
      assignmentRows.map((assignment) => [
        assignment.patient_id,
        assignment.assigned_at,
      ]),
    );
    const latestEncounterByPatient = new Map<string, EncounterRow>();

    for (const encounter of (encountersResult.data ?? []) as EncounterRow[]) {
      if (!latestEncounterByPatient.has(encounter.patient_id)) {
        latestEncounterByPatient.set(encounter.patient_id, encounter);
      }
    }

    return ((patientsResult.data ?? []) as PatientRow[])
      .sort((left, right) =>
        `${left.last_name} ${left.first_name}`.localeCompare(
          `${right.last_name} ${right.first_name}`,
        ),
      )
      .map((patient) => {
        const latestEncounter = latestEncounterByPatient.get(patient.id);
        const assignedAt = assignmentsByPatient.get(patient.id);

        return {
          patientId: patient.id,
          firstName: patient.first_name,
          lastName: patient.last_name,
          fullName: `${patient.first_name} ${patient.last_name}`,
          approximateAge: this.calculateAge(patient.birth_date),
          sex: patient.sex,
          bloodType: patient.blood_type,
          documentCode: patient.document_code,
          phone: patient.phone,
          assignedAt: this.parseDate(assignedAt),
          lastEncounter: {
            reason: latestEncounter?.reason ?? null,
            status: latestEncounter?.status ?? null,
            startedAt: this.parseNullableDate(latestEncounter?.started_at),
          },
        };
      });
  }

  async getAuthorizedContext(
    doctorUserId: string,
    patientId: string,
  ): Promise<ClinicalContext> {
    const doctorId = await this.findDoctorId(doctorUserId);
    const patient = await this.findPatient(patientId);

    if (!patient) {
      throw new NotFoundException('El paciente no existe.');
    }

    if (!doctorId) {
      throw new ForbiddenException(
        'El medico no tiene acceso autorizado a este paciente.',
      );
    }

    const { data: assignment, error: assignmentError } =
      await this.supabaseService
        .getClient()
        .from('doctor_patient_assignments')
        .select('patient_id')
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .eq('active', true)
        .maybeSingle();

    this.throwIfSupabaseError(assignmentError);

    if (!assignment) {
      throw new ForbiddenException(
        'El medico no tiene acceso autorizado a este paciente.',
      );
    }

    const encounter = await this.findLatestEncounter(doctorId, patientId);
    const [vitalSigns, allergies, laboratoryResults] = await Promise.all([
      encounter?.id ? this.findLatestVitalSigns(encounter.id) : null,
      this.findAllergies(patientId),
      this.findLaboratoryResults(patientId),
    ]);

    return {
      patient: {
        id: patient.id,
        fullName: patient.first_name + ' ' + patient.last_name,
        approximateAge: this.calculateAge(patient.birth_date),
        sex: patient.sex,
        bloodType: patient.blood_type,
      },
      encounter: {
        id: encounter?.id ?? null,
        reason: encounter?.reason ?? null,
        symptoms: encounter?.symptoms ?? null,
        diagnosis: encounter?.diagnosis ?? null,
        treatment: encounter?.treatment ?? null,
        clinicalNotes: encounter?.clinical_notes ?? null,
        status: encounter?.status ?? null,
        startedAt: this.parseNullableDate(encounter?.started_at),
      },
      vitalSigns,
      allergies,
      laboratoryResults,
    };
  }

  private async findDoctorId(doctorUserId: string): Promise<string | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('doctors')
      .select('id')
      .eq('user_id', doctorUserId)
      .maybeSingle();

    this.throwIfSupabaseError(error);

    let row = this.toNullableRow<DoctorRow>(data);

    if (!row) {
      const { data: doctorData, error: doctorError } =
        await this.supabaseService
          .getClient()
          .from('doctors')
          .select('id')
          .eq('id', doctorUserId)
          .maybeSingle();

      this.throwIfSupabaseError(doctorError);
      row = this.toNullableRow<DoctorRow>(doctorData);
    }

    return row?.id ?? null;
  }

  private async findPatient(patientId: string): Promise<PatientRow | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('patients')
      .select(
        'id, first_name, last_name, birth_date, sex, blood_type, document_code, phone',
      )
      .eq('id', patientId)
      .maybeSingle();

    this.throwIfSupabaseError(error);

    return this.toNullableRow<PatientRow>(data);
  }

  private async findLatestEncounter(
    doctorId: string,
    patientId: string,
  ): Promise<EncounterRow | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('medical_encounters')
      .select(
        'id, patient_id, reason, symptoms, diagnosis, treatment, clinical_notes, status, started_at',
      )
      .eq('doctor_id', doctorId)
      .eq('patient_id', patientId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    this.throwIfSupabaseError(error);

    return this.toNullableRow<EncounterRow>(data);
  }

  private async findLatestVitalSigns(
    encounterId: string,
  ): Promise<ClinicalContext['vitalSigns']> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('vital_signs')
      .select(
        'temperature, systolic_pressure, diastolic_pressure, heart_rate, respiratory_rate, oxygen_saturation',
      )
      .eq('encounter_id', encounterId)
      .order('measured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    this.throwIfSupabaseError(error);

    const row = this.toNullableRow<VitalSignsRow>(data);

    if (!row) {
      return null;
    }

    return {
      temperature: row.temperature,
      systolicPressure: row.systolic_pressure,
      diastolicPressure: row.diastolic_pressure,
      heartRate: row.heart_rate,
      respiratoryRate: row.respiratory_rate,
      oxygenSaturation: row.oxygen_saturation,
    };
  }

  private async findAllergies(
    patientId: string,
  ): Promise<ClinicalContext['allergies']> {
    const { data: links, error: linksError } = await this.supabaseService
      .getClient()
      .from('patient_allergies')
      .select('allergy_id, reaction, severity')
      .eq('patient_id', patientId);

    this.throwIfSupabaseError(linksError);

    const allergyLinks = (links ?? []) as PatientAllergyRow[];
    const allergyIds = allergyLinks.map((link) => link.allergy_id);

    if (allergyIds.length === 0) {
      return [];
    }

    const { data: allergies, error: allergiesError } =
      await this.supabaseService
        .getClient()
        .from('allergies')
        .select('id, name')
        .in('id', allergyIds);

    this.throwIfSupabaseError(allergiesError);

    const allergiesById = new Map(
      ((allergies ?? []) as AllergyRow[]).map((allergy) => [
        allergy.id,
        allergy.name,
      ]),
    );

    return allergyLinks
      .map((link) => ({
        name: allergiesById.get(link.allergy_id) ?? '',
        reaction: link.reaction,
        severity: link.severity,
      }))
      .filter((allergy) => allergy.name.length > 0)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private async findLaboratoryResults(
    patientId: string,
  ): Promise<ClinicalContext['laboratoryResults']> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('lab_results')
      .select(
        'test_name, result_value, unit, reference_range, status, performed_at',
      )
      .eq('patient_id', patientId)
      .order('performed_at', { ascending: false })
      .limit(10);

    this.throwIfSupabaseError(error);

    return ((data ?? []) as LabResultRow[]).map((lab) => ({
      testName: lab.test_name,
      resultValue: lab.result_value,
      unit: lab.unit,
      referenceRange: lab.reference_range,
      status: lab.status,
      performedAt: this.parseDate(lab.performed_at),
    }));
  }

  private throwIfSupabaseError(error: unknown): void {
    if (!error) {
      return;
    }

    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'Supabase no esta disponible.';

    throw new ServiceUnavailableException(message);
  }

  private toNullableRow<T>(data: unknown): T | null {
    return data ? (data as T) : null;
  }

  private calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    const currentMonth = today.getUTCMonth();
    const birthMonth = birth.getUTCMonth();
    const hasBirthdayPassed =
      currentMonth > birthMonth ||
      (currentMonth === birthMonth && today.getUTCDate() >= birth.getUTCDate());

    if (!hasBirthdayPassed) {
      age -= 1;
    }

    return age;
  }

  private parseDate(value: string | undefined): Date {
    return value ? new Date(value) : new Date(0);
  }

  private parseNullableDate(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
  }
}
