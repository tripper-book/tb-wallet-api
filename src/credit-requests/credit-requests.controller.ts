import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { ErrorResponseDto } from '../common/dto/api-responses.dto';
import { CreditRequestsService } from './credit-requests.service';
import { CreateCreditRequestDto } from './dto/create-credit-request.dto';
import { CreditRequestResponseDto, CreditRequestsListResponseDto } from './dto/credit-request-response.dto';

@ApiTags('wallet')
@Controller('wallet/credit-requests')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
export class CreditRequestsController {
  constructor(private readonly creditRequestsService: CreditRequestsService) {}

  /**
   * Creates a credit request (status: pending_approval). Admin must approve to credit wallet.
   * @param reqUser - Injected from Bearer token
   * @param dto - amount_cents (required), currency, notes
   * @returns Created CreditRequest
   */
  @Post()
  @ApiOperation({ summary: 'Request credit (goes to approval flow)' })
  @ApiBody({
    description: 'Credit amount in paise. Request goes to pending_approval until admin approves.',
    examples: {
      default: { summary: 'Request ₹500 credit', value: { amount_cents: '50000', currency: 'INR', notes: 'Top-up request' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Credit request created, pending admin approval', type: CreditRequestResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing token', type: ErrorResponseDto })
  async create(@CurrentUser() reqUser: RequestUser, @Body() dto: CreateCreditRequestDto) {
    return this.creditRequestsService.create(reqUser, dto);
  }

  /**
   * Returns paginated list of credit requests for the authenticated user.
   * @param reqUser - Injected from Bearer token
   * @param limit - Max items (default 20)
   * @param offset - Pagination offset
   * @returns { items, total }
   */
  @Get()
  @ApiOperation({ summary: 'List my credit requests' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max items (default 20)', example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Pagination offset', example: 0 })
  @ApiResponse({ status: 200, description: 'List of credit requests', type: CreditRequestsListResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing token', type: ErrorResponseDto })
  async list(
    @CurrentUser() reqUser: RequestUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.creditRequestsService.findMyRequests(reqUser, limit ? parseInt(limit, 10) : 20, offset ? parseInt(offset, 10) : 0);
  }
}
