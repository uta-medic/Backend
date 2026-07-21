/* =========================================================
   UTA MEDIC - ESTRUCTURA DEL MVP
   ========================================================= */

CREATE TABLE MedicalCenters (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(200) NOT NULL,
    center_type NVARCHAR(30) NOT NULL,
    zone NVARCHAR(100) NOT NULL,
    address NVARCHAR(300) NOT NULL,
    phone NVARCHAR(50) NULL,
    opening_hours NVARCHAR(200) NULL,
    emergency_24h BIT NOT NULL DEFAULT 0,
    active BIT NOT NULL DEFAULT 1
);

CREATE TABLE Specialties (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(150) NOT NULL UNIQUE,
    description NVARCHAR(500) NULL,
    active BIT NOT NULL DEFAULT 1
);

CREATE TABLE Users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    role NVARCHAR(20) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT CK_Users_Role
        CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN'))
);

CREATE TABLE Patients (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(150) NOT NULL,
    birth_date DATE NOT NULL,
    sex CHAR(1) NOT NULL,
    blood_type NVARCHAR(5) NULL,
    document_code NVARCHAR(50) NOT NULL UNIQUE,
    phone NVARCHAR(30) NULL,

    CONSTRAINT FK_Patients_Users
        FOREIGN KEY (user_id) REFERENCES Users(id)
);

CREATE TABLE Doctors (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
    center_id UNIQUEIDENTIFIER NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(150) NOT NULL,
    medical_license NVARCHAR(100) NOT NULL UNIQUE,
    verified BIT NOT NULL DEFAULT 0,

    CONSTRAINT FK_Doctors_Users
        FOREIGN KEY (user_id) REFERENCES Users(id),

    CONSTRAINT FK_Doctors_Centers
        FOREIGN KEY (center_id) REFERENCES MedicalCenters(id)
);

CREATE TABLE DoctorSpecialties (
    doctor_id UNIQUEIDENTIFIER NOT NULL,
    specialty_id UNIQUEIDENTIFIER NOT NULL,

    CONSTRAINT PK_DoctorSpecialties
        PRIMARY KEY (doctor_id, specialty_id),

    CONSTRAINT FK_DoctorSpecialties_Doctors
        FOREIGN KEY (doctor_id) REFERENCES Doctors(id),

    CONSTRAINT FK_DoctorSpecialties_Specialties
        FOREIGN KEY (specialty_id) REFERENCES Specialties(id)
);

CREATE TABLE DoctorPatientAssignments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    doctor_id UNIQUEIDENTIFIER NOT NULL,
    patient_id UNIQUEIDENTIFIER NOT NULL,
    assigned_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    active BIT NOT NULL DEFAULT 1,

    CONSTRAINT FK_Assignments_Doctors
        FOREIGN KEY (doctor_id) REFERENCES Doctors(id),

    CONSTRAINT FK_Assignments_Patients
        FOREIGN KEY (patient_id) REFERENCES Patients(id),

    CONSTRAINT UQ_DoctorPatient
        UNIQUE (doctor_id, patient_id)
);

CREATE TABLE MedicalEncounters (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    patient_id UNIQUEIDENTIFIER NOT NULL,
    doctor_id UNIQUEIDENTIFIER NOT NULL,
    reason NVARCHAR(500) NOT NULL,
    symptoms NVARCHAR(MAX) NULL,
    diagnosis NVARCHAR(MAX) NULL,
    treatment NVARCHAR(MAX) NULL,
    clinical_notes NVARCHAR(MAX) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'OPEN',
    started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ended_at DATETIME2 NULL,

    CONSTRAINT FK_Encounters_Patients
        FOREIGN KEY (patient_id) REFERENCES Patients(id),

    CONSTRAINT FK_Encounters_Doctors
        FOREIGN KEY (doctor_id) REFERENCES Doctors(id),

    CONSTRAINT CK_Encounters_Status
        CHECK (status IN ('OPEN', 'CLOSED', 'DRAFT'))
);

CREATE TABLE VitalSigns (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    encounter_id UNIQUEIDENTIFIER NOT NULL,
    temperature DECIMAL(4,1) NULL,
    systolic_pressure SMALLINT NULL,
    diastolic_pressure SMALLINT NULL,
    heart_rate SMALLINT NULL,
    respiratory_rate SMALLINT NULL,
    oxygen_saturation DECIMAL(5,2) NULL,
    measured_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_VitalSigns_Encounters
        FOREIGN KEY (encounter_id) REFERENCES MedicalEncounters(id)
);

CREATE TABLE Allergies (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE PatientAllergies (
    patient_id UNIQUEIDENTIFIER NOT NULL,
    allergy_id UNIQUEIDENTIFIER NOT NULL,
    reaction NVARCHAR(300) NULL,
    severity NVARCHAR(20) NULL,

    CONSTRAINT PK_PatientAllergies
        PRIMARY KEY (patient_id, allergy_id),

    CONSTRAINT FK_PatientAllergies_Patients
        FOREIGN KEY (patient_id) REFERENCES Patients(id),

    CONSTRAINT FK_PatientAllergies_Allergies
        FOREIGN KEY (allergy_id) REFERENCES Allergies(id)
);

CREATE TABLE LabResults (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    patient_id UNIQUEIDENTIFIER NOT NULL,
    encounter_id UNIQUEIDENTIFIER NULL,
    test_name NVARCHAR(200) NOT NULL,
    result_value NVARCHAR(100) NOT NULL,
    unit NVARCHAR(50) NULL,
    reference_range NVARCHAR(100) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'READY',
    performed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_LabResults_Patients
        FOREIGN KEY (patient_id) REFERENCES Patients(id),

    CONSTRAINT FK_LabResults_Encounters
        FOREIGN KEY (encounter_id) REFERENCES MedicalEncounters(id)
);

CREATE INDEX IX_Encounters_Patient
    ON MedicalEncounters(patient_id, started_at);

CREATE INDEX IX_LabResults_Patient
    ON LabResults(patient_id, performed_at);

SELECT
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
