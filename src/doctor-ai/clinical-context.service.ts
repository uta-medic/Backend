import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as sql from 'mssql';
import { SqlService } from '../database/sql.service';

export interface ClinicalContext {
  patient: {
    id: string;
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

interface MainClinicalRow {
  patient_id: string;
  approximate_age: number;
  sex: string;
  blood_type: string | null;
  encounter_id: string | null;
  reason: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  clinical_notes: string | null;
  encounter_status: string | null;
  started_at: Date | null;
  temperature: number | null;
  systolic_pressure: number | null;
  diastolic_pressure: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
}

interface PatientSummaryRow {
  patient_id: string;
  first_name: string;
  last_name: string;
  approximate_age: number;
  sex: string;
  blood_type: string | null;
  document_code: string;
  phone: string | null;
  assigned_at: Date;
  last_encounter_reason: string | null;
  last_encounter_status: string | null;
  last_encounter_started_at: Date | null;
}

@Injectable()
export class ClinicalContextService {
  constructor(private readonly sqlService: SqlService) {}

  async listAuthorizedPatients(
    doctorUserId: string,
  ): Promise<PatientSummary[]> {
    const request = this.sqlService.createRequest();

    request.input('doctorUserId', sql.UniqueIdentifier, doctorUserId);

    const result = await request.query<PatientSummaryRow>(`
      SELECT
          p.id AS patient_id,
          p.first_name,
          p.last_name,
          DATEDIFF(
              YEAR,
              p.birth_date,
              CONVERT(DATE, SYSUTCDATETIME())
          ) AS approximate_age,
          p.sex,
          p.blood_type,
          p.document_code,
          p.phone,
          assignment.assigned_at,
          latestEncounter.reason AS last_encounter_reason,
          latestEncounter.status AS last_encounter_status,
          latestEncounter.started_at AS last_encounter_started_at
      FROM dbo.DoctorPatientAssignments AS assignment
      INNER JOIN dbo.Doctors AS doctor
          ON doctor.id = assignment.doctor_id
         AND doctor.user_id = @doctorUserId
      INNER JOIN dbo.Patients AS p
          ON p.id = assignment.patient_id
      OUTER APPLY (
          SELECT TOP (1)
              encounter.reason,
              encounter.status,
              encounter.started_at
          FROM dbo.MedicalEncounters AS encounter
          WHERE encounter.patient_id = p.id
            AND encounter.doctor_id = doctor.id
          ORDER BY encounter.started_at DESC
      ) AS latestEncounter
      WHERE assignment.active = 1
      ORDER BY p.last_name, p.first_name;
    `);

    return result.recordset.map((row) => ({
      patientId: row.patient_id,
      firstName: row.first_name,
      lastName: row.last_name,
      fullName: `${row.first_name} ${row.last_name}`,
      approximateAge: row.approximate_age,
      sex: row.sex,
      bloodType: row.blood_type,
      documentCode: row.document_code,
      phone: row.phone,
      assignedAt: row.assigned_at,
      lastEncounter: {
        reason: row.last_encounter_reason,
        status: row.last_encounter_status,
        startedAt: row.last_encounter_started_at,
      },
    }));
  }

  async getAuthorizedContext(
    doctorUserId: string,
    patientId: string,
  ): Promise<ClinicalContext> {
    const mainRequest = this.sqlService.createRequest();

    mainRequest.input('doctorUserId', sql.UniqueIdentifier, doctorUserId);
    mainRequest.input('patientId', sql.UniqueIdentifier, patientId);

    const mainResult = await mainRequest.query<MainClinicalRow>(`
      SELECT TOP (1)
          p.id AS patient_id,
          DATEDIFF(
              YEAR,
              p.birth_date,
              CONVERT(DATE, SYSUTCDATETIME())
          ) AS approximate_age,
          p.sex,
          p.blood_type,
          me.id AS encounter_id,
          me.reason,
          me.symptoms,
          me.diagnosis,
          me.treatment,
          me.clinical_notes,
          me.status AS encounter_status,
          me.started_at,
          vs.temperature,
          vs.systolic_pressure,
          vs.diastolic_pressure,
          vs.heart_rate,
          vs.respiratory_rate,
          vs.oxygen_saturation
      FROM dbo.Patients AS p
      INNER JOIN dbo.DoctorPatientAssignments AS assignment
          ON assignment.patient_id = p.id
         AND assignment.active = 1
      INNER JOIN dbo.Doctors AS doctor
          ON doctor.id = assignment.doctor_id
         AND doctor.user_id = @doctorUserId
      LEFT JOIN dbo.MedicalEncounters AS me
          ON me.patient_id = p.id
         AND me.doctor_id = doctor.id
      OUTER APPLY (
          SELECT TOP (1)
              vital.temperature,
              vital.systolic_pressure,
              vital.diastolic_pressure,
              vital.heart_rate,
              vital.respiratory_rate,
              vital.oxygen_saturation
          FROM dbo.VitalSigns AS vital
          WHERE vital.encounter_id = me.id
          ORDER BY vital.measured_at DESC
      ) AS vs
      WHERE p.id = @patientId
      ORDER BY me.started_at DESC;
    `);

    const row = mainResult.recordset[0];

    if (!row) {
      const patientRequest = this.sqlService.createRequest();

      patientRequest.input('patientId', sql.UniqueIdentifier, patientId);

      const patientResult = await patientRequest.query(`
        SELECT TOP (1) id
        FROM dbo.Patients
        WHERE id = @patientId;
      `);

      if (patientResult.recordset.length === 0) {
        throw new NotFoundException('El paciente no existe.');
      }

      throw new ForbiddenException(
        'El medico no tiene acceso autorizado a este paciente.',
      );
    }

    const allergiesRequest = this.sqlService.createRequest();

    allergiesRequest.input('patientId', sql.UniqueIdentifier, patientId);

    const allergiesResult = await allergiesRequest.query<{
      name: string;
      reaction: string | null;
      severity: string | null;
    }>(`
      SELECT
          allergy.name,
          patientAllergy.reaction,
          patientAllergy.severity
      FROM dbo.PatientAllergies AS patientAllergy
      INNER JOIN dbo.Allergies AS allergy
          ON allergy.id = patientAllergy.allergy_id
      WHERE patientAllergy.patient_id = @patientId
      ORDER BY allergy.name;
    `);

    const labsRequest = this.sqlService.createRequest();

    labsRequest.input('patientId', sql.UniqueIdentifier, patientId);

    const labsResult = await labsRequest.query<{
      test_name: string;
      result_value: string;
      unit: string | null;
      reference_range: string | null;
      status: string;
      performed_at: Date;
    }>(`
      SELECT TOP (10)
          test_name,
          result_value,
          unit,
          reference_range,
          status,
          performed_at
      FROM dbo.LabResults
      WHERE patient_id = @patientId
      ORDER BY performed_at DESC;
    `);

    const hasVitalSigns =
      row.temperature !== null ||
      row.systolic_pressure !== null ||
      row.diastolic_pressure !== null ||
      row.heart_rate !== null ||
      row.respiratory_rate !== null ||
      row.oxygen_saturation !== null;

    return {
      patient: {
        id: row.patient_id,
        approximateAge: row.approximate_age,
        sex: row.sex,
        bloodType: row.blood_type,
      },
      encounter: {
        id: row.encounter_id,
        reason: row.reason,
        symptoms: row.symptoms,
        diagnosis: row.diagnosis,
        treatment: row.treatment,
        clinicalNotes: row.clinical_notes,
        status: row.encounter_status,
        startedAt: row.started_at,
      },
      vitalSigns: hasVitalSigns
        ? {
            temperature: row.temperature,
            systolicPressure: row.systolic_pressure,
            diastolicPressure: row.diastolic_pressure,
            heartRate: row.heart_rate,
            respiratoryRate: row.respiratory_rate,
            oxygenSaturation: row.oxygen_saturation,
          }
        : null,
      allergies: allergiesResult.recordset,
      laboratoryResults: labsResult.recordset.map((lab) => ({
        testName: lab.test_name,
        resultValue: lab.result_value,
        unit: lab.unit,
        referenceRange: lab.reference_range,
        status: lab.status,
        performedAt: lab.performed_at,
      })),
    };
  }
}
