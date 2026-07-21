import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMedicalTicketsTable1784602316045 implements MigrationInterface {
  name = 'CreateMedicalTicketsTable1784602316045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "medical_tickets" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_a9fcb5e162c5c18741ec5685af1" DEFAULT NEWSEQUENTIALID(), "appointmentId" uniqueidentifier NOT NULL, "triageAssessmentId" uniqueidentifier NOT NULL, "hospitalId" uniqueidentifier NOT NULL, "specialtyId" uniqueidentifier NOT NULL, "ticketNumber" nvarchar(40) NOT NULL, "dailySequence" int NOT NULL, "ticketDate" date NOT NULL, "triagePriority" nvarchar(30) NOT NULL, "priorityPatientType" nvarchar(40) NOT NULL CONSTRAINT "DF_f03c1576dfaeb2cbc91cffd0777" DEFAULT 'none', "hasPriorityCare" bit NOT NULL CONSTRAINT "DF_c0fedaf655347e1ab6361d11970" DEFAULT 0, "status" nvarchar(40) NOT NULL CONSTRAINT "DF_003a8bb441782b3eeaab1d42211" DEFAULT 'ready_for_check_in', "checkedInAt" datetime2, "calledAt" datetime2, "serviceStartedAt" datetime2, "completedAt" datetime2, "createdAt" datetime2 NOT NULL CONSTRAINT "DF_3812d428232876ef7efdf35eefe" DEFAULT getdate(), "updatedAt" datetime2 NOT NULL CONSTRAINT "DF_84d1b5a8fef7f4da7a75b34fbc5" DEFAULT getdate(), CONSTRAINT "UQ_e375ea6251627c94c6895c71d07" UNIQUE ("ticketNumber"), CONSTRAINT "PK_a9fcb5e162c5c18741ec5685af1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_medical_tickets_daily_sequence" ON "medical_tickets" ("ticketDate", "hospitalId", "specialtyId", "dailySequence") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_medical_tickets_triage" ON "medical_tickets" ("triageAssessmentId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_medical_tickets_appointment" ON "medical_tickets" ("appointmentId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UQ_medical_tickets_appointment" ON "medical_tickets"`,
    );
    await queryRunner.query(
      `DROP INDEX "UQ_medical_tickets_triage" ON "medical_tickets"`,
    );
    await queryRunner.query(
      `DROP INDEX "UQ_medical_tickets_daily_sequence" ON "medical_tickets"`,
    );
    await queryRunner.query(`DROP TABLE "medical_tickets"`);
  }
}
