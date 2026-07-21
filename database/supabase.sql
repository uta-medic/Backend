-- UTA MEDIC - Supabase/PostgreSQL schema and demo data
-- Run this file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists medical_centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  center_type text not null,
  zone text not null,
  address text not null,
  phone text,
  opening_hours text,
  emergency_24h boolean not null default false,
  active boolean not null default true
);

create table if not exists specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('PATIENT', 'DOCTOR', 'ADMIN')),
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id),
  first_name text not null,
  last_name text not null,
  birth_date date not null,
  sex char(1) not null,
  blood_type text,
  document_code text not null unique,
  phone text
);

create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id),
  center_id uuid not null references medical_centers(id),
  first_name text not null,
  last_name text not null,
  medical_license text not null unique,
  verified boolean not null default false
);

create table if not exists doctor_specialties (
  doctor_id uuid not null references doctors(id),
  specialty_id uuid not null references specialties(id),
  primary key (doctor_id, specialty_id)
);

create table if not exists doctor_patient_assignments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(id),
  patient_id uuid not null references patients(id),
  assigned_at timestamptz not null default now(),
  active boolean not null default true,
  unique (doctor_id, patient_id)
);

create table if not exists medical_encounters (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references doctors(id),
  reason text not null,
  symptoms text,
  diagnosis text,
  treatment text,
  clinical_notes text,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED', 'DRAFT')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists vital_signs (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references medical_encounters(id),
  temperature numeric(4, 1),
  systolic_pressure smallint,
  diastolic_pressure smallint,
  heart_rate smallint,
  respiratory_rate smallint,
  oxygen_saturation numeric(5, 2),
  measured_at timestamptz not null default now()
);

create table if not exists allergies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists patient_allergies (
  patient_id uuid not null references patients(id),
  allergy_id uuid not null references allergies(id),
  reaction text,
  severity text,
  primary key (patient_id, allergy_id)
);

create table if not exists lab_results (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  encounter_id uuid references medical_encounters(id),
  test_name text not null,
  result_value text not null,
  unit text,
  reference_range text,
  status text not null default 'READY',
  performed_at timestamptz not null default now()
);

create index if not exists ix_encounters_patient
  on medical_encounters(patient_id, started_at desc);

create index if not exists ix_lab_results_patient
  on lab_results(patient_id, performed_at desc);

insert into medical_centers (
  id, name, center_type, zone, address, phone, opening_hours, emergency_24h
) values
  (
    '10000000-0000-4000-8000-000000000001',
    'Centro Medico Uta Central',
    'MUNICIPAL',
    'Centro',
    'Direccion ficticia de demostracion',
    '22000001',
    'Lunes a viernes de 08:00 a 18:00',
    true
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Centro Medico Uta Cotahuma',
    'MUNICIPAL',
    'Cotahuma',
    'Direccion ficticia de demostracion',
    '22000002',
    'Lunes a sabado de 08:00 a 17:00',
    true
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'Centro Medico Uta Zona Sur',
    'MUNICIPAL',
    'Zona Sur',
    'Direccion ficticia de demostracion',
    '22000003',
    'Lunes a viernes de 08:00 a 16:00',
    false
  )
on conflict (id) do nothing;

insert into specialties (id, name, description) values
  (
    '20000000-0000-4000-8000-000000000001',
    'Medicina General',
    'Atencion medica inicial y orientacion.'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'Cardiologia',
    'Atencion relacionada con el sistema cardiovascular.'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'Gastroenterologia',
    'Atencion relacionada con el sistema digestivo.'
  )
on conflict (id) do nothing;

insert into users (id, email, role, status) values
  ('30000000-0000-4000-8000-000000000001', 'valeria.rojas@demo.utamedic.bo', 'DOCTOR', 'ACTIVE'),
  ('30000000-0000-4000-8000-000000000002', 'diego.condori@demo.utamedic.bo', 'DOCTOR', 'ACTIVE'),
  ('40000000-0000-4000-8000-000000000001', 'ana.quispe@demo.utamedic.bo', 'PATIENT', 'ACTIVE'),
  ('40000000-0000-4000-8000-000000000002', 'carlos.mamani@demo.utamedic.bo', 'PATIENT', 'ACTIVE'),
  ('40000000-0000-4000-8000-000000000003', 'laura.choque@demo.utamedic.bo', 'PATIENT', 'ACTIVE')
on conflict (id) do nothing;

insert into doctors (
  id, user_id, center_id, first_name, last_name, medical_license, verified
) values
  (
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Valeria',
    'Rojas Flores',
    'DEMO-MED-001',
    true
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'Diego',
    'Condori Apaza',
    'DEMO-MED-002',
    true
  )
on conflict (id) do nothing;

insert into doctor_specialties (doctor_id, specialty_id) values
  ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003'),
  ('50000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002')
on conflict (doctor_id, specialty_id) do nothing;

insert into patients (
  id, user_id, first_name, last_name, birth_date, sex, blood_type, document_code, phone
) values
  (
    '60000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Ana',
    'Quispe Flores',
    '1992-04-12',
    'F',
    'O+',
    'DEMO-CI-001',
    '70000001'
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    'Carlos',
    'Mamani Choque',
    '1974-11-03',
    'M',
    'A+',
    'DEMO-CI-002',
    '70000002'
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000003',
    'Laura',
    'Choque Apaza',
    '2001-08-20',
    'F',
    'B+',
    'DEMO-CI-003',
    '70000003'
  )
on conflict (id) do nothing;

insert into doctor_patient_assignments (doctor_id, patient_id, active) values
  ('50000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', true),
  ('50000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', true),
  ('50000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000003', true)
on conflict (doctor_id, patient_id) do nothing;

insert into medical_encounters (
  id, patient_id, doctor_id, reason, symptoms, clinical_notes, status
) values
  (
    '70000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'Dolor abdominal',
    'Dolor en la parte superior del abdomen, nauseas y acidez durante tres dias.',
    'Paciente ficticia para demostracion del agente medico.',
    'OPEN'
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    '60000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000002',
    'Control de presion arterial',
    'Cefalea ocasional. No presenta dolor toracico ni dificultad respiratoria.',
    'Paciente ficticio con hipertension en seguimiento.',
    'OPEN'
  )
on conflict (id) do nothing;

insert into vital_signs (
  id, encounter_id, temperature, systolic_pressure, diastolic_pressure,
  heart_rate, respiratory_rate, oxygen_saturation
) values
  (
    '90000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001',
    37.2,
    125,
    80,
    84,
    18,
    97
  ),
  (
    '90000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000002',
    36.6,
    148,
    92,
    78,
    17,
    98
  )
on conflict (id) do nothing;

insert into allergies (id, name) values
  ('80000000-0000-4000-8000-000000000001', 'Penicilina'),
  ('80000000-0000-4000-8000-000000000002', 'Ibuprofeno')
on conflict (id) do nothing;

insert into patient_allergies (patient_id, allergy_id, reaction, severity) values
  (
    '60000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000001',
    'Erupcion cutanea',
    'MODERATE'
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    '80000000-0000-4000-8000-000000000002',
    'Urticaria',
    'SEVERE'
  )
on conflict (patient_id, allergy_id) do nothing;

insert into lab_results (
  id, patient_id, encounter_id, test_name, result_value, unit, reference_range, status
) values
  (
    'a0000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001',
    'Hemoglobina',
    '13.8',
    'g/dL',
    '12.0 - 16.0',
    'READY'
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    '60000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001',
    'Glucosa',
    '92',
    'mg/dL',
    '70 - 100',
    'READY'
  ),
  (
    'a0000000-0000-4000-8000-000000000003',
    '60000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000002',
    'Glucosa en ayunas',
    '108',
    'mg/dL',
    '70 - 100',
    'READY'
  )
on conflict (id) do nothing;
