import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../auth/current-user.decorator';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionReferenceType } from '../transactions/entities/transaction-type.enum';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallets/wallets.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { PaymentProvider } from '../payment-providers/entities/payment-provider.entity';
import { MockPspGatewayService } from './mock-psp.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(PaymentProvider)
    private readonly providerRepo: Repository<PaymentProvider>,
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
    private readonly transactionsService: TransactionsService,
    private readonly mockPsp: MockPspGatewayService,
  ) {}

  async create(reqUser: RequestUser, dto: CreateOrderDto): Promise<Order> {
    const user = await this.usersService.getOrCreateFromRequestUser(reqUser);
    const providerId = dto.provider_id ?? await this.getDefaultProviderId();
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider || !provider.is_active) {
      throw new NotFoundException('Payment provider not found or inactive');
    }

    const order = this.orderRepo.create({
      user_id: user.id,
      provider_id: provider.id,
      amount_cents: dto.amount_cents,
      currency: dto.currency ?? 'INR',
      status: OrderStatus.PENDING,
      metadata: dto.metadata ?? null,
    });
    await this.orderRepo.save(order);

    const pspResponse = await this.mockPsp.createOrder({
      orderId: order.id,
      amountCents: dto.amount_cents,
      currency: order.currency,
      userId: user.id,
      metadata: dto.metadata,
    });

    order.psp_order_id = pspResponse.order_id;
    order.psp_token = pspResponse.token;
    order.redirect_url = pspResponse.redirect_url;
    order.status = OrderStatus.CREATED;
    await this.orderRepo.save(order);
    return order;
  }

  /** Called when PSP payment succeeds (e.g. callback or booking success). Credits wallet and logs transaction. */
  async confirmOrderSuccess(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === OrderStatus.SUCCESS) return order;

    await this.walletService.credit(
      order.user_id,
      order.amount_cents,
      TransactionReferenceType.ORDER,
      order.id,
    );
    order.status = OrderStatus.SUCCESS;
    await this.orderRepo.save(order);
    return order;
  }

  private async getDefaultProviderId(): Promise<string> {
    const p = await this.providerRepo.findOne({
      where: { is_active: true, type: 'mock' },
      order: { created_at: 'ASC' },
    });
    if (!p) throw new NotFoundException('No active payment provider (run seed or add mock provider)');
    return p.id;
  }
}
