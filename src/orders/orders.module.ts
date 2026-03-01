import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentProvider } from '../payment-providers/entities/payment-provider.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallets/wallets.module';
import { Order } from './entities/order.entity';
import { MockPspGatewayService } from './mock-psp.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, PaymentProvider]),
    UsersModule,
    WalletModule,
    TransactionsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, MockPspGatewayService],
  exports: [OrdersService],
})
export class OrdersModule {}
