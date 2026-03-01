import {
  Controller,
  Get,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Optional() private readonly dataSource: DataSource | null) {}

  /**
   * Liveness probe. No auth required.
   * @returns { status: 'ok' }
   */
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({
    status: 200,
    description: 'Service is up',
    schema: { properties: { status: { type: "string", example: "ok" } }, required: ['status'] },
  })
  check(): { status: string } {
    return { status: 'ok' };
  }

  /**
   * Runs SELECT 1 against the database. Fails if DB not configured or unreachable.
   * @returns { status, db, latencyMs } or 503 with error body
   */
  @Get('db')
  @ApiOperation({ summary: 'Database connection test (MySQL)' })
  @ApiResponse({
    status: 200,
    description: 'Database connection OK',
    schema: {
      properties: {
        status: { type: "string", example: "ok" },
        db: { type: "string", example: "mysql" },
        latencyMs: { type: "number", example: 2 },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Database connection failed',
    schema: {
      properties: {
        status: { type: "string", example: "error" },
        db: { type: "string" },
        message: { type: "string" },
      },
    },
  })
  async checkDb(): Promise<{ status: string; db: string; latencyMs?: number }> {
    if (!this.dataSource) {
      throw new ServiceUnavailableException({
        status: 'error',
        db: 'mysql',
        message: 'Database not configured (SKIP_DB=true)',
      });
    }
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      const latencyMs = Date.now() - start;
      return { status: 'ok', db: 'mysql', latencyMs };
    } catch (err) {
      throw new ServiceUnavailableException({
        status: 'error',
        db: 'mysql',
        message: err instanceof Error ? err.message : 'Connection failed',
      });
    }
  }
}
