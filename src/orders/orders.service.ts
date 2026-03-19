import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import { PayuService, PayuCallbackPayload, PayuTransactionDetails } from './payu.service';

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
    private readonly payuService: PayuService,
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

    if (provider.type === 'payu') {
      if (!this.payuService.isConfigured()) {
        throw new BadRequestException(
          'PayU is not configured. Set PAYU_MERCHANT_KEY, PAYU_MERCHANT_SALT, PAYU_SUCCESS_URL, PAYU_FAILURE_URL in .env',
        );
      }
      const productinfo =
        (dto.metadata?.productinfo as string) || 'Wallet Top-up';
      const phone =
        (dto.metadata?.phone as string) || (user.email ? '0000000000' : '0000000000');
      const { paymentUrl, params } = this.payuService.getPaymentParams({
        txnid: order.id,
        amountCents: dto.amount_cents,
        currency: order.currency,
        productinfo,
        firstname: user.name || user.email || 'User',
        email: user.email || `user-${user.id}@wallet.local`,
        phone,
        udf1: order.id,
      });
      order.psp_order_id = order.id;
      order.psp_token = null;
      order.redirect_url = paymentUrl;
      order.metadata = { ...(order.metadata || {}), payu_params: params };
      order.status = OrderStatus.CREATED;
      await this.orderRepo.save(order);
      return order;
    }

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

  /**
   * Handle PayU Hosted Checkout callback (surl/furl). Verifies hash, updates order, returns redirect info.
   */
  async handlePayuCallback(
    success: boolean,
    payload: PayuCallbackPayload,
  ): Promise<{ orderId: string; redirectUrl: string } | null> {
    if (!this.payuService.verifyResponse(payload)) {
      return null;
    }
    const txnid = payload.txnid;
    if (!txnid) return null;
    const order = await this.orderRepo.findOne({
      where: { id: txnid },
      relations: ['user'],
    });
    if (!order) return null;
    if (success) {
      await this.confirmOrderSuccess(order.id);
      return {
        orderId: order.id,
        redirectUrl: this.payuService.getSuccessRedirectUrl(order.id),
      };
    }
    order.status = OrderStatus.FAILED;
    await this.orderRepo.save(order);
    return {
      orderId: order.id,
      redirectUrl: this.payuService.getFailureRedirectUrl(order.id),
    };
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

  /** Admin: list all orders with optional filters and pagination. */
  async findAllForAdmin(options: {
    limit?: number;
    offset?: number;
    status?: OrderStatus;
    providerType?: string;
  }): Promise<{ items: Order[]; total: number }> {
    const { limit = 20, offset = 0, status, providerType } = options;
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.provider', 'provider')
      .orderBy('order.created_at', 'DESC');
    if (status) qb.andWhere('order.status = :status', { status });
    if (providerType) qb.andWhere('provider.type = :providerType', { providerType });
    const total = await qb.getCount();
    qb.take(Math.min(limit, 100)).skip(offset);
    const items = await qb.getMany();
    return { items, total };
  }

  /** Admin: get order by ID with user and provider; for PayU orders also fetches transaction details from PayU. */
  async findOneForAdmin(
    id: string,
  ): Promise<{ order: Order; payuTransactionDetails?: PayuTransactionDetails | null }> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['user', 'provider'],
    });
    if (!order) throw new NotFoundException('Order not found');
    let payuTransactionDetails: PayuTransactionDetails | null | undefined;
    if (order.provider?.type === 'payu') {
      const txnId = order.psp_order_id || order.id;
      payuTransactionDetails = await this.payuService.verifyPayment(txnId);
    }
    return { order, payuTransactionDetails };
  }

  private async getDefaultProviderId(): Promise<string> {
    if (this.payuService.isConfigured()) {
      const payu = await this.providerRepo.findOne({
        where: { is_active: true, type: 'payu' },
        order: { created_at: 'ASC' },
      });
      if (payu) return payu.id;
    }
    const p = await this.providerRepo.findOne({
      where: { is_active: true, type: 'mock' },
      order: { created_at: 'ASC' },
    });
    if (!p) throw new NotFoundException('No active payment provider (run seed or add PayU/mock provider)');
    return p.id;
  }
}
