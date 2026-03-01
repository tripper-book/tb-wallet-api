import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    const body =
      typeof message === 'object' && message !== null
        ? (message as Record<string, unknown>)
        : { message };

    this.logger.error(
      `${request.method} ${request.url} ${status} | ${JSON.stringify(body)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const responseBody =
      typeof message === 'object' && message !== null && 'statusCode' in (message as object)
        ? (message as Record<string, unknown>)
        : {
            statusCode: status,
            error: (body as { error?: string }).error ?? 'Error',
            message: (body as { message?: string }).message ?? body,
          };
    response.status(status).json(responseBody);
  }
}
