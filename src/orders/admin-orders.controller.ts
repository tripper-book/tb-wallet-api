import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ErrorResponseDto } from '../common/dto/api-responses.dto';
import { OrdersService } from './orders.service';
import { OrderStatus } from './entities/order.entity';

@ApiTags('admin')
@Controller('admin/orders')
@UseGuards(AuthGuard, AdminGuard)
@ApiBearerAuth('access-token')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * List all orders (admin). Optional filters and pagination.
   * PayU orders can be inspected in detail via GET /admin/orders/:id.
   */
  @Get()
  @ApiOperation({ summary: 'List all orders (admin)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus, description: 'Filter by order status' })
  @ApiQuery({ name: 'providerType', required: false, type: String, description: 'e.g. payu, mock' })
  @ApiResponse({ status: 200, description: 'List of orders with user and provider' })
  @ApiResponse({ status: 401, description: 'Invalid or missing token / not admin', type: ErrorResponseDto })
  async listAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
    @Query('providerType') providerType?: string,
  ) {
    const statusEnum = status && Object.values(OrderStatus).includes(status as OrderStatus) ? (status as OrderStatus) : undefined;
    return this.ordersService.findAllForAdmin({
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      status: statusEnum,
      providerType: providerType || undefined,
    });
  }

  /**
   * Get order by ID with user and provider. For PayU orders, fetches transaction details from PayU.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID (admin); includes PayU transaction when provider is PayU' })
  @ApiParam({ name: 'id', description: 'Order UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Order with user, provider, and optional payuTransactionDetails' })
  @ApiResponse({ status: 401, description: 'Invalid or missing token / not admin', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found', type: ErrorResponseDto })
  async getById(@Param('id') id: string) {
    return this.ordersService.findOneForAdmin(id);
  }
}
