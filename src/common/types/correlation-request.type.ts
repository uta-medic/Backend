import { Request } from 'express';

export interface CorrelationRequest extends Request {
  correlationId: string;
}
