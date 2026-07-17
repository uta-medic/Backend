import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { DoctorAiService } from './doctor-ai.service';
import { AnalyzePatientDto } from './dto/analyze-patient.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    role: string;
  };
}

@Controller('doctor-ai')
export class DoctorAiController {
  constructor(
    private readonly doctorAiService: DoctorAiService,
    private readonly configService: ConfigService,
  ) {}

  @Get('patients')
  async listPatients(
    @Req() request: AuthenticatedRequest,
    @Headers('x-doctor-user-id') devDoctorUserId?: string,
  ) {
    const doctorUserId = this.getDoctorUserId(request, devDoctorUserId);

    return this.doctorAiService.listPatients(doctorUserId);
  }

  @Post('analyze')
  async analyze(
    @Req() request: AuthenticatedRequest,
    @Body() dto: AnalyzePatientDto,
    @Headers('x-doctor-user-id') devDoctorUserId?: string,
  ) {
    const doctorUserId = this.getDoctorUserId(request, devDoctorUserId);

    return this.doctorAiService.analyzePatient(doctorUserId, dto);
  }

  private getDoctorUserId(
    request: AuthenticatedRequest,
    devDoctorUserId?: string,
  ): string {
    const doctorUserId = request.user?.sub;

    if (doctorUserId) {
      return doctorUserId;
    }

    const devHeaderEnabled =
      this.configService.get<string>('DEV_AUTH_DOCTOR_HEADER_ENABLED') ===
      'true';

    if (devHeaderEnabled && devDoctorUserId) {
      if (!this.isUuid(devDoctorUserId)) {
        throw new BadRequestException(
          'El header x-doctor-user-id debe ser un UUID valido.',
        );
      }

      return devDoctorUserId;
    }

    throw new UnauthorizedException('No se encontro el medico autenticado.');
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
