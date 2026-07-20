import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Response } from 'express';
import { CorrelationRequest } from '../types/correlation-request.type';

interface NestErrorBody {
  error?: string;
  message?: string | string[];
}

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<CorrelationRequest>();
    const response = context.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionBody = this.getExceptionBody(exception);
    const isInternalError = statusCode >= 500;

    const body = {
      statusCode,
      error: isInternalError
        ? 'Internal Server Error'
        : (exceptionBody.error ?? this.statusLabel(statusCode)),
      message: isInternalError
        ? 'An unexpected error occurred'
        : (exceptionBody.message ?? this.statusLabel(statusCode)),
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
      correlationId: request.correlationId ?? 'unavailable',
    };

    const logContext = `${request.method} ${body.path} ${statusCode} correlationId=${body.correlationId}`;
    if (isInternalError) {
      this.logger.error(logContext);
    } else {
      this.logger.warn(logContext);
    }

    this.adapterHost.httpAdapter.reply(response, body, statusCode);
  }

  private getExceptionBody(exception: unknown): NestErrorBody {
    if (!(exception instanceof HttpException)) {
      return {};
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return { message: response };
    }
    if (typeof response === 'object' && response !== null) {
      return response;
    }
    return {};
  }

  private statusLabel(statusCode: number): string {
    return HttpStatus[statusCode] ?? 'Error';
  }
}
