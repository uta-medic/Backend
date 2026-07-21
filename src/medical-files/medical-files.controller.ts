import {
  Controller, Post, Get, Delete, Param, Body,
  UseGuards, UseInterceptors, UploadedFile, Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// import { RolesGuard } from '../common/guards/roles.guard';
// import { Roles } from '../common/decorators/roles.decorator';
import { MedicalFilesService } from './medical-files.service';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('medical-files')
// @UseGuards(RolesGuard)
export class MedicalFilesController {
  constructor(private readonly filesService: MedicalFilesService) {}

  @Post('upload')
  // @Roles('doctor', 'admin')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadFileDto, @Req() req: any) {
    // 🔥 CAMBIADO: userId como string
    const userId = '1';  // ← String, no number
    const userRole = 'doctor';
    const userIp = req.ip || '127.0.0.1';
    
    return this.filesService.upload(
      file, 
      dto.patientCi, 
      dto.description || 'Archivo médico', 
      userId, 
      userRole, 
      userIp
    );
  }

  @Get('patient/:ci')
  // @Roles('doctor', 'admin', 'paciente')
  async listForPatient(@Param('ci') ci: string, @Req() req: any) {
    const userId = '1';  // ← String, no number
    const userRole = 'doctor';
    return this.filesService.listForPatient(ci, userId, userRole);
  }

  @Get(':id/download-url')
  // @Roles('doctor', 'admin', 'paciente')
  async getDownloadUrl(@Param('id') id: string, @Req() req: any) {
    const userId = '1';  // ← String, no number
    const userRole = 'doctor';
    const userIp = req.ip || '127.0.0.1';
    const url = await this.filesService.getDownloadUrl(id, userId, userRole, userIp);
    return { url };
  }

  @Delete(':id')
  // @Roles('doctor', 'admin')
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = '1';  // ← String, no number
    const userRole = 'doctor';
    const userIp = req.ip || '127.0.0.1';
    await this.filesService.delete(id, userId, userRole, userIp);
    return { success: true };
  }
}