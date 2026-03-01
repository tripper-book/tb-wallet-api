import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const { method, url, ip, body } = request;
    const userAgent = request.get('user-agent') ?? '';
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    this.logger.log(
      `[${requestId}] --> ${method} ${url} | ip=${ip ?? 'unknown'} | body=${JSON.stringify(this.sanitize(body))}`,
    );

    const start = Date.now();
    return next.handle().pipe(
      tap({
        next: (data) => {
          const statusCode = context.switchToHttp().getResponse().statusCode;
          const duration = Date.now() - start;
          this.logger.log(
            `[${requestId}] <-- ${method} ${url} ${statusCode} | ${duration}ms`,
          );
        },
        error: (err) => {
          const duration = Date.now() - start;
          this.logger.error(
            `[${requestId}] <-- ${method} ${url} ERROR | ${duration}ms | ${err?.message ?? err}`,
          );
        },
      }),
    );
  }

  private sanitize(obj: unknown): unknown {
    if (obj === undefined || obj === null) return obj;
    if (typeof obj !== 'object') return obj;
    const copy = { ...(obj as Record<string, unknown>) };
    const sensitive = ['password', 'token', 'authorization', 'cookie'];
    for (const key of Object.keys(copy)) {
      if (sensitive.some((s) => key.toLowerCase().includes(s))) {
        copy[key] = '[REDACTED]';
      }
    }
    return copy;
  }
}
