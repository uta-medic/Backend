import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AzureBlobService } from './azure-blob.service';
import { AuditLogService } from './audit-log.service';
import { randomUUID } from 'crypto';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/dicom': 'DICOM',
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
};

@Injectable()
export class MedicalFilesService {
  constructor(
    private prisma: PrismaService,
    private blobService: AzureBlobService,
    private auditLog: AuditLogService,
  ) {}

  async upload(
    file: Express.Multer.File,
    patientCi: string,
    description: string | undefined,
    uploadedById: string,
    userRole: string,
    ip?: string,
  ) {
    const fileType = ALLOWED_MIME_TYPES[file.mimetype];
    if (!fileType) {
      throw new ForbiddenException('Tipo de archivo no permitido. Solo PDF, DICOM o imágenes.');
    }

    const blobPath = `${patientCi}/${randomUUID()}-${file.originalname}`;
    await this.blobService.uploadFile(blobPath, file.buffer, file.mimetype);

    const record = await this.prisma.medicalFile.create({
      data: {
        patientCi,
        uploadedById,
        fileName: file.originalname,
        fileType,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        blobPath,
        description,
      },
    });

    await this.auditLog.log(record.id, uploadedById, userRole, 'UPLOAD', ip);
    return record;
  }

  async listForPatient(patientCi: string, requesterId: string, requesterRole: string) {
    if (requesterRole === 'paciente' && requesterId !== patientCi) {
      throw new ForbiddenException('No puedes ver archivos de otro paciente');
    }
    return this.prisma.medicalFile.findMany({
      where: { patientCi },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDownloadUrl(fileId: string, requesterId: string, requesterRole: string, ip?: string) {
    const file = await this.prisma.medicalFile.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('Archivo no encontrado');

    if (requesterRole === 'paciente' && requesterId !== file.patientCi) {
      throw new ForbiddenException('No puedes acceder a este archivo');
    }

    const url = await this.blobService.getDownloadUrl(file.blobPath);
    await this.auditLog.log(file.id, requesterId, requesterRole, 'DOWNLOAD', ip);
    return url;
  }

  async delete(fileId: string, requesterId: string, requesterRole: string, ip?: string) {
    if (requesterRole !== 'doctor' && requesterRole !== 'admin') {
      throw new ForbiddenException('Solo un doctor o admin puede eliminar archivos');
    }
    const file = await this.prisma.medicalFile.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('Archivo no encontrado');

    await this.blobService.deleteFile(file.blobPath);
    await this.auditLog.log(file.id, requesterId, requesterRole, 'DELETE', ip);
    await this.prisma.medicalFile.delete({ where: { id: fileId } });
  }
}