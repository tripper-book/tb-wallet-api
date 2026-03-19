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
    const sensitive = [
      'password',
      'token',
      'authorization',
      'cookie',
      // Payments / PayU
      'salt',
      'secret',
      'client_secret',
      'clientid',
      'client_id',
      'merchant',
      'key',
      'hash',
      'signature',
    ];

    const redactKey = (k: string) => sensitive.some((s) => k.toLowerCase().includes(s));

    const walk = (value: unknown): unknown => {
      if (value === null || value === undefined) return value;
      if (typeof value !== 'object') return value;
      if (Array.isArray(value)) return value.map(walk);
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = redactKey(k) ? '[REDACTED]' : walk(v);
      }
      return out;
    };

    return walk(obj);
  }
}
