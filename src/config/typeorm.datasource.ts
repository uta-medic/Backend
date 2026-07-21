import 'dotenv/config';

import { DataSource } from 'typeorm';

import { Appointment } from '../appointments/entities/appointment.entity';

import { TriageAssessment } from '../triage-assessments/entities/triage-assessment.entity';

import { MedicalTicket } from '../medical-tickets/entities/medical-ticket.entity';

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

export default new DataSource({
  type: 'mssql',

  host: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT ?? 1433),

  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  entities: [Appointment, TriageAssessment, MedicalTicket],

  migrations: ['src/migrations/*.ts'],

  synchronize: false,

  options: {
    encrypt: parseBoolean(process.env.DB_ENCRYPT, true),
    trustServerCertificate: parseBoolean(
      process.env.DB_TRUST_SERVER_CERTIFICATE,
      false,
    ),
  },
});
