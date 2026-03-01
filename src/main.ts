import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ensureDatabase } from './database/ensure-database';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const skipDb = process.env.SKIP_DB === 'true';
  console.log(`SKIP_DB=${process.env.SKIP_DB} → database ${skipDb ? 'disabled' : 'enabled'}`);
  if (!skipDb) {
    try {
      await ensureDatabase();
    } catch (err) {
      console.error('Database setup failed. Start MySQL or set SKIP_DB=true in .env');
      console.error(err);
      process.exit(1);
    }
  }
  const app = await NestFactory.create(AppModule);
  // Allow frontend (e.g. localhost:3001) to call this API. Set CORS_ORIGIN in production.
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3001';
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('TB Wallet API')
    .setDescription(
      [
        'Wallet, orders, transactions, and credit-request flows.',
        '',
        '**Authentication (Bearer token)**',
        'Protected endpoints require `Authorization: Bearer <token>`. Use one of these mock tokens (no quotes in the box):',
        '- **User:** `mock-token-1` or `mock-token-2`',
        '- **Admin:** `mock-admin-token` (for /admin/credit-requests approve/reject)',
        '',
        'In Swagger: click **Authorize**, enter the token (e.g. `mock-token-1`) in the Value field, then click Authorize.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description:
          'User: mock-token-1 | mock-token-2 — Admin: mock-admin-token. Enter the token only (e.g. mock-token-1).',
        in: 'header',
      },
      'access-token',
    )
    .addTag('health', 'Health and database connection checks')
    .addTag('wallet', 'Wallet balance (checkout flow)')
    .addTag('transactions', 'Transaction logs per user')
    .addTag('orders', 'Create order / PSP flow')
    .addTag('admin', 'Admin: approve/reject credit requests')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Enable Swagger in all environments
  if (process.env.SWAGGER_ENABLED !== 'false') {
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.29.1/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.29.1/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.29.1/swagger-ui-standalone-preset.js',
    ],
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api`);
}
bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
