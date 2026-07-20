import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'Cannot GET /api/v1/unknown' },
      { type: 'array', items: { type: 'string' } },
    ],
  })
  message: string | string[];

  @ApiProperty({ example: '/api/v1/unknown' })
  path: string;

  @ApiProperty({ example: '2026-07-19T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '8b976a42-1030-4271-9d5d-86a2df6132dd' })
  correlationId: string;
}
