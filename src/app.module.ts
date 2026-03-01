import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { CreditRequestsModule } from './credit-requests/credit-requests.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { OrdersModule } from './orders/orders.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallets/wallets.module';

const skipDb = process.env.SKIP_DB === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(skipDb
      ? []
      : [
          TypeOrmModule.forRoot({
            type: 'mysql',
            host: process.env.DB_HOST ?? 'localhost',
            port: parseInt(process.env.DB_PORT ?? '3306', 10),
            username: process.env.DB_USER ?? 'root',
            password: process.env.DB_PASSWORD ?? '',
            database: process.env.DB_NAME ?? 'tb_wallet',
            autoLoadEntities: true,
            synchronize: false,
            migrationsRun: false,
          }),
        ]),
    AuthModule,
    HealthModule,
    UsersModule,
    WalletModule,
    TransactionsModule,
    OrdersModule,
    CreditRequestsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
