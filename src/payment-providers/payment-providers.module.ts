import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentProvider } from './entities/payment-provider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentProvider])],
  exports: [TypeOrmModule],
})
export class PaymentProvidersModule {}
