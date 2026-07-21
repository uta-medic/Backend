import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTriageAssessmentsTable1784586621391 implements MigrationInterface {
  name = 'CreateTriageAssessmentsTable1784586621391';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "triage_assessments" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_fc0083fe2498fbeeab1a90104f4" DEFAULT NEWSEQUENTIALID(), "appointmentId" uniqueidentifier NOT NULL, "reportedSymptoms" nvarchar(2000) NOT NULL, "additionalNotes" nvarchar(1000), "status" nvarchar(40) NOT NULL CONSTRAINT "DF_010dfd6d746fdb25fbc08bf0941" DEFAULT 'pending_review', "assignedPriority" nvarchar(30), "reviewedByUserId" uniqueidentifier, "reviewNotes" nvarchar(1000), "reviewedAt" datetime2, "createdAt" datetime2 NOT NULL CONSTRAINT "DF_857196092d51a1b1efcf7d4edd7" DEFAULT getdate(), "updatedAt" datetime2 NOT NULL CONSTRAINT "DF_d4b7a4ac5f87bc7c9fc1c27ffc0" DEFAULT getdate(), CONSTRAINT "PK_fc0083fe2498fbeeab1a90104f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_triage_assessments_appointment" ON "triage_assessments" ("appointmentId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UQ_triage_assessments_appointment" ON "triage_assessments"`,
    );
    await queryRunner.query(`DROP TABLE "triage_assessments"`);
  }
}
