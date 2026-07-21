import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppointmentsTable1784572297422 implements MigrationInterface {
  name = 'CreateAppointmentsTable1784572297422';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "appointments" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_4a437a9a27e948726b8bb3e36ad" DEFAULT NEWSEQUENTIALID(), "patientId" uniqueidentifier NOT NULL, "doctorId" uniqueidentifier NOT NULL, "hospitalId" uniqueidentifier NOT NULL, "specialtyId" uniqueidentifier NOT NULL, "scheduledAt" datetime2 NOT NULL, "reason" nvarchar(500) NOT NULL, "status" nvarchar(30) NOT NULL CONSTRAINT "DF_3007a47d97a542e63b3308a69b7" DEFAULT 'scheduled', "cancellationReason" nvarchar(500), "cancelledAt" datetime2, "createdAt" datetime2 NOT NULL CONSTRAINT "DF_35f60b9559a21b8f1e216d97b48" DEFAULT getdate(), "updatedAt" datetime2 NOT NULL CONSTRAINT "DF_ca56438e19701c823d0221150d3" DEFAULT getdate(), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_appointments_doctor_scheduled_at" ON "appointments" ("doctorId", "scheduledAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UQ_appointments_doctor_scheduled_at" ON "appointments"`,
    );
    await queryRunner.query(`DROP TABLE "appointments"`);
  }
}
