import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: 'ok';

  @ApiProperty({ example: 'utamedic-backend' })
  service: 'utamedic-backend';

  @ApiProperty({ example: '2026-07-19T12:00:00.000Z' })
  timestamp: string;
}
