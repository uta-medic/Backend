import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  getStatus(): HealthResponseDto {
    return {
      status: 'ok',
      service: 'utamedic-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
