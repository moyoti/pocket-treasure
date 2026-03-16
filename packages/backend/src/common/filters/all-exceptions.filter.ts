import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
  error?: string;
  details?: any;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorResponse = {
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message: exceptionResponse,
          error: exception.name,
        };
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, any>;
        errorResponse = {
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message: responseObj.message || exception.message,
          error: responseObj.error || exception.name,
          details: responseObj.details,
        };
      } else {
        errorResponse = {
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message: exception.message,
          error: exception.name,
        };
      }

      // Log client errors (4xx) as warnings, server errors (5xx) as errors
      if (status >= 500) {
        this.logger.error(
          `${request.method} ${request.url} - ${status} - ${JSON.stringify(errorResponse.message)}`,
          exception.stack,
        );
      } else if (status >= 400) {
        this.logger.warn(
          `${request.method} ${request.url} - ${status} - ${JSON.stringify(errorResponse.message)}`,
        );
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: 'Internal server error',
        error: 'InternalServerError',
      };

      // Log unexpected errors with full stack trace
      this.logger.error(
        `${request.method} ${request.url} - ${status} - Unexpected error`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(errorResponse);
  }
}