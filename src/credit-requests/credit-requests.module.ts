import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallets/wallets.module';
import { AdminCreditRequestsController } from './admin-credit-requests.controller';
import { CreditRequestsController } from './credit-requests.controller';
import { CreditRequestsService } from './credit-requests.service';
import { CreditRequest } from './entities/credit-request.entity';
import { CreditRequestLog } from './entities/credit-request-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreditRequest, CreditRequestLog]),
    UsersModule,
    WalletModule,
    TransactionsModule,
  ],
  controllers: [CreditRequestsController, AdminCreditRequestsController],
  providers: [CreditRequestsService],
  exports: [CreditRequestsService],
})
export class CreditRequestsModule {}
