import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order.dto';
import { ErrorResponseDto } from '../common/dto/api-responses.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Creates an order with the payment provider (PSP); returns psp_token and redirect_url for the payment UI.
   * @param reqUser - Injected from Bearer token
   * @param dto - amount_cents (required), currency, provider_id, metadata
   * @returns { order_id, status, psp_order_id?, psp_token?, redirect_url? }
   */
  @Post()
  @ApiOperation({ summary: 'Create order with PSP (steps 11–14); returns token & redirect_url' })
  @ApiBody({
    description: 'Order details. Amount in paise (e.g. 10000 = ₹100).',
    examples: {
      default: { summary: 'Create order for ₹100', value: { amount_cents: '10000', currency: 'INR' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Order created; use redirect_url for payment', type: CreateOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing token', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Payment provider not found', type: ErrorResponseDto })
  async create(@CurrentUser() reqUser: RequestUser, @Body() dto: CreateOrderDto): Promise<CreateOrderResponseDto> {
    const order = await this.ordersService.create(reqUser, dto);
    const out: CreateOrderResponseDto = {
      order_id: order.id,
      status: order.status,
      psp_order_id: order.psp_order_id ?? undefined,
      psp_token: order.psp_token ?? undefined,
      redirect_url: order.redirect_url ?? undefined,
    };
    return out;
  }

  /**
   * Marks order as success and credits the user's wallet. Idempotent if already success.
   * @param orderId - UUID of the order (path param)
   * @returns Updated Order entity
   */
  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm order success (e.g. after PSP callback); credits wallet' })
  @ApiParam({ name: 'id', description: 'Order UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Order marked success, wallet credited' })
  @ApiResponse({ status: 401, description: 'Invalid or missing token', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found', type: ErrorResponseDto })
  async confirm(@Param('id') orderId: string) {
    return this.ordersService.confirmOrderSuccess(orderId);
  }
}
