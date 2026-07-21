/* =========================================================
   UTA MEDIC - DATOS FICTICIOS DEL MVP
   ========================================================= */

DECLARE
    @center1 UNIQUEIDENTIFIER = NEWID(),
    @center2 UNIQUEIDENTIFIER = NEWID(),
    @center3 UNIQUEIDENTIFIER = NEWID(),

    @specialtyGeneral UNIQUEIDENTIFIER = NEWID(),
    @specialtyCardiology UNIQUEIDENTIFIER = NEWID(),
    @specialtyGastro UNIQUEIDENTIFIER = NEWID(),

    @doctorUser1 UNIQUEIDENTIFIER = NEWID(),
    @doctorUser2 UNIQUEIDENTIFIER = NEWID(),
    @doctor1 UNIQUEIDENTIFIER = NEWID(),
    @doctor2 UNIQUEIDENTIFIER = NEWID(),

    @patientUser1 UNIQUEIDENTIFIER = NEWID(),
    @patientUser2 UNIQUEIDENTIFIER = NEWID(),
    @patientUser3 UNIQUEIDENTIFIER = NEWID(),
    @patient1 UNIQUEIDENTIFIER = NEWID(),
    @patient2 UNIQUEIDENTIFIER = NEWID(),
    @patient3 UNIQUEIDENTIFIER = NEWID(),

    @encounter1 UNIQUEIDENTIFIER = NEWID(),
    @encounter2 UNIQUEIDENTIFIER = NEWID(),

    @allergy1 UNIQUEIDENTIFIER = NEWID(),
    @allergy2 UNIQUEIDENTIFIER = NEWID();

/* Centros ficticios */

INSERT INTO MedicalCenters (
    id, name, center_type, zone, address,
    phone, opening_hours, emergency_24h
)
VALUES
(
    @center1,
    N'Centro Médico Uta Central',
    N'MUNICIPAL',
    N'Centro',
    N'Dirección ficticia de demostración',
    N'22000001',
    N'Lunes a viernes de 08:00 a 18:00',
    1
),
(
    @center2,
    N'Centro Médico Uta Cotahuma',
    N'MUNICIPAL',
    N'Cotahuma',
    N'Dirección ficticia de demostración',
    N'22000002',
    N'Lunes a sábado de 08:00 a 17:00',
    1
),
(
    @center3,
    N'Centro Médico Uta Zona Sur',
    N'MUNICIPAL',
    N'Zona Sur',
    N'Dirección ficticia de demostración',
    N'22000003',
    N'Lunes a viernes de 08:00 a 16:00',
    0
);

/* Especialidades */

INSERT INTO Specialties (id, name, description)
VALUES
(
    @specialtyGeneral,
    N'Medicina General',
    N'Atención médica inicial y orientación.'
),
(
    @specialtyCardiology,
    N'Cardiología',
    N'Atención relacionada con el sistema cardiovascular.'
),
(
    @specialtyGastro,
    N'Gastroenterología',
    N'Atención relacionada con el sistema digestivo.'
);

/* Usuarios médicos */

INSERT INTO Users (id, email, role, status)
VALUES
(
    @doctorUser1,
    N'valeria.rojas@demo.utamedic.bo',
    N'DOCTOR',
    N'ACTIVE'
),
(
    @doctorUser2,
    N'diego.condori@demo.utamedic.bo',
    N'DOCTOR',
    N'ACTIVE'
);

/* Médicos */

INSERT INTO Doctors (
    id, user_id, center_id, first_name,
    last_name, medical_license, verified
)
VALUES
(
    @doctor1,
    @doctorUser1,
    @center1,
    N'Valeria',
    N'Rojas Flores',
    N'DEMO-MED-001',
    1
),
(
    @doctor2,
    @doctorUser2,
    @center2,
    N'Diego',
    N'Condori Apaza',
    N'DEMO-MED-002',
    1
);

INSERT INTO DoctorSpecialties (doctor_id, specialty_id)
VALUES
(@doctor1, @specialtyGeneral),
(@doctor1, @specialtyGastro),
(@doctor2, @specialtyGeneral),
(@doctor2, @specialtyCardiology);

/* Usuarios pacientes */

INSERT INTO Users (id, email, role, status)
VALUES
(
    @patientUser1,
    N'ana.quispe@demo.utamedic.bo',
    N'PATIENT',
    N'ACTIVE'
),
(
    @patientUser2,
    N'carlos.mamani@demo.utamedic.bo',
    N'PATIENT',
    N'ACTIVE'
),
(
    @patientUser3,
    N'laura.choque@demo.utamedic.bo',
    N'PATIENT',
    N'ACTIVE'
);

/* Pacientes */

INSERT INTO Patients (
    id, user_id, first_name, last_name,
    birth_date, sex, blood_type,
    document_code, phone
)
VALUES
(
    @patient1,
    @patientUser1,
    N'Ana',
    N'Quispe Flores',
    '1992-04-12',
    'F',
    N'O+',
    N'DEMO-CI-001',
    N'70000001'
),
(
    @patient2,
    @patientUser2,
    N'Carlos',
    N'Mamani Choque',
    '1974-11-03',
    'M',
    N'A+',
    N'DEMO-CI-002',
    N'70000002'
),
(
    @patient3,
    @patientUser3,
    N'Laura',
    N'Choque Apaza',
    '2001-08-20',
    'F',
    N'B+',
    N'DEMO-CI-003',
    N'70000003'
);

/* Asignaciones */

INSERT INTO DoctorPatientAssignments (
    doctor_id, patient_id, active
)
VALUES
(@doctor1, @patient1, 1),
(@doctor2, @patient2, 1),
(@doctor1, @patient3, 1);

/* Consultas clínicas */

INSERT INTO MedicalEncounters (
    id, patient_id, doctor_id,
    reason, symptoms, clinical_notes, status
)
VALUES
(
    @encounter1,
    @patient1,
    @doctor1,
    N'Dolor abdominal',
    N'Dolor en la parte superior del abdomen, náuseas y acidez durante tres días.',
    N'Paciente ficticia para demostración del agente médico.',
    N'OPEN'
),
(
    @encounter2,
    @patient2,
    @doctor2,
    N'Control de presión arterial',
    N'Cefalea ocasional. No presenta dolor torácico ni dificultad respiratoria.',
    N'Paciente ficticio con hipertensión en seguimiento.',
    N'OPEN'
);

/* Signos vitales */

INSERT INTO VitalSigns (
    encounter_id, temperature,
    systolic_pressure, diastolic_pressure,
    heart_rate, respiratory_rate,
    oxygen_saturation
)
VALUES
(
    @encounter1,
    37.2,
    125,
    80,
    84,
    18,
    97
),
(
    @encounter2,
    36.6,
    148,
    92,
    78,
    17,
    98
);

/* Alergias */

INSERT INTO Allergies (id, name)
VALUES
(@allergy1, N'Penicilina'),
(@allergy2, N'Ibuprofeno');

INSERT INTO PatientAllergies (
    patient_id, allergy_id, reaction, severity
)
VALUES
(
    @patient1,
    @allergy1,
    N'Erupción cutánea',
    N'MODERATE'
),
(
    @patient3,
    @allergy2,
    N'Urticaria',
    N'SEVERE'
);

/* Resultados de laboratorio */

INSERT INTO LabResults (
    patient_id, encounter_id, test_name,
    result_value, unit, reference_range, status
)
VALUES
(
    @patient1,
    @encounter1,
    N'Hemoglobina',
    N'13.8',
    N'g/dL',
    N'12.0 - 16.0',
    N'READY'
),
(
    @patient1,
    @encounter1,
    N'Glucosa',
    N'92',
    N'mg/dL',
    N'70 - 100',
    N'READY'
),
(
    @patient2,
    @encounter2,
    N'Glucosa en ayunas',
    N'108',
    N'mg/dL',
    N'70 - 100',
    N'READY'
);

/* Verificación */

SELECT
    id,
    first_name,
    last_name,
    birth_date,
    blood_type,
    document_code
FROM Patients;