/**
 * Generic PSP response for create order. Real gateways (HDFC Avenue, etc.) return token + redirect URL.
 */
export interface CreateOrderPspResponse {
  order_id: string;
  token: string;
  redirect_url: string;
}

export interface IPspGateway {
  createOrder(params: {
    orderId: string;
    amountCents: string;
    currency: string;
    userId: string;
    metadata?: Record<string, unknown>;
  }): Promise<CreateOrderPspResponse>;
}
