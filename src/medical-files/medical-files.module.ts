import { Module } from '@nestjs/common';
import { MedicalFilesController } from './medical-files.controller';
import { MedicalFilesService } from './medical-files.service';
import { AzureBlobService } from './azure-blob.service';
import { AuditLogService } from './audit-log.service';

@Module({
  controllers: [MedicalFilesController],
  providers: [MedicalFilesService, AzureBlobService, AuditLogService],
})
export class MedicalFilesModule {}