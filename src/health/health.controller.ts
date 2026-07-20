import { Controller, Get } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/types/error-response.dto';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Comprueba que el proceso backend está disponible' })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  getHealth(): HealthResponseDto {
    return this.healthService.getStatus();
  }
}
