import { Injectable } from '@nestjs/common';
import { CreateOrderPspResponse, IPspGateway } from './psp-gateway.interface';

/**
 * Mock PSP (e.g. HDFC Avenue). Replace with real gateway adapter later.
 */
@Injectable()
export class MockPspGatewayService implements IPspGateway {
  async createOrder(params: {
    orderId: string;
    amountCents: string;
    currency: string;
    userId: string;
    metadata?: Record<string, unknown>;
  }): Promise<CreateOrderPspResponse> {
    return {
      order_id: `psp_${params.orderId}_${Date.now()}`,
      token: `mock_token_${params.orderId}`,
      redirect_url: `https://mock-psp.example.com/pay?order=${params.orderId}&token=mock_token_${params.orderId}`,
    };
  }
}
