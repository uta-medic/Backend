import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from './constants';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(fileId: string, userId: string, userRole: string, action: AuditAction, ipAddress?: string) {
    await this.prisma.auditLog.create({
      data: { fileId, userId, userRole, action, ipAddress },
    });
  }

  async getLogsForFile(fileId: string) {
    return this.prisma.auditLog.findMany({
      where: { fileId },
      orderBy: { createdAt: 'desc' },
    });
  }
}