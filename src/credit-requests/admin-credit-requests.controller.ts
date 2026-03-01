import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ErrorResponseDto, CreditRequestLogEntryDto } from '../common/dto/api-responses.dto';
import { CreditRequestsService } from './credit-requests.service';
import { ApproveCreditRequestDto, RejectCreditRequestDto } from './dto/approve-credit-request.dto';
import { CreditRequestResponseDto, CreditRequestsListResponseDto } from './dto/credit-request-response.dto';
import { CreditRequestStatus } from './entities/credit-request-status.enum';

@ApiTags('admin')
@Controller('admin/credit-requests')
@UseGuards(AuthGuard, AdminGuard)
@ApiBearerAuth('access-token')
export class AdminCreditRequestsController {
  constructor(private readonly creditRequestsService: CreditRequestsService) {}

  /**
   * Returns all credit requests (admin). Optional status filter and pagination.
   * @param limit - Max items (default 20, max 100)
   * @param offset - Pagination offset
   * @param status - Filter by status: pending_approval | approved | rejected
   * @returns { items, total }
   */
  @Get()
  @ApiOperation({ summary: 'List all credit requests (admin)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max items (default 20, max 100)', example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Pagination offset', example: 0 })
  @ApiQuery({ name: 'status', required: false, enum: ['pending_approval', 'approved', 'rejected'], description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'List of all credit requests', type: CreditRequestsListResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing token / not admin', type: ErrorResponseDto })
  async listAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
  ) {
    const statusEnum =
      status === 'pending_approval' || status === 'approved' || status === 'rejected'
        ? (status as CreditRequestStatus)
        : undefined;
    return this.creditRequestsService.findAll({
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      status: statusEnum,
    });
  }

  /**
   * Returns a single credit request by ID with user details. Admin only.
   * @param id - Credit request UUID (path)
   * @returns CreditRequest with user relation
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get credit request details by ID (admin)' })
  @ApiParam({ name: 'id', description: 'Credit request UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Credit request details including user', type: CreditRequestResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing token / not admin', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Credit request not found', type: ErrorResponseDto })
  async getById(@Param('id') id: string) {
    return this.creditRequestsService.findOneById(id);
  }

  /**
   * Approves a pending credit request: credits the user's wallet and logs the transaction.
   * Requires admin token (e.g. mock-admin-token).
   * @param reqUser - Injected from Bearer token (must have role: admin)
   * @param id - Credit request UUID (path)
   * @param dto - Optional admin_notes
   * @returns Updated CreditRequest (status: approved)
   */
  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve credit request; credits wallet and logs transaction' })
  @ApiParam({ name: 'id', description: 'Credit request UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({
    description: 'Optional admin note. Use Bearer token: mock-admin-token',
    examples: {
      default: { summary: 'Approve with note', value: { admin_notes: 'Approved via support ticket #123' } },
      empty: { summary: 'Approve without note', value: {} },
    },
  })
  @ApiResponse({ status: 200, description: 'Credit request approved, wallet balance updated', type: CreditRequestResponseDto })
  @ApiResponse({ status: 400, description: 'Request not pending', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing token / not admin', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Credit request not found', type: ErrorResponseDto })
  async approve(
    @CurrentUser() reqUser: RequestUser,
    @Param('id') id: string,
    @Body() dto: ApproveCreditRequestDto,
  ) {
    return this.creditRequestsService.approve(id, reqUser.id, dto.admin_notes);
  }

  /**
   * Rejects a pending credit request. Does not credit wallet.
   * @param reqUser - Injected from Bearer token (admin)
   * @param id - Credit request UUID (path)
   * @param dto - Optional admin_notes (reason)
   * @returns Updated CreditRequest (status: rejected)
   */
  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject credit request' })
  @ApiParam({ name: 'id', description: 'Credit request UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({
    description: 'Optional reason. Use Bearer token: mock-admin-token',
    examples: {
      default: { summary: 'Reject with reason', value: { admin_notes: 'Insufficient KYC' } },
      empty: { summary: 'Reject without note', value: {} },
    },
  })
  @ApiResponse({ status: 200, description: 'Credit request rejected', type: CreditRequestResponseDto })
  @ApiResponse({ status: 400, description: 'Request not pending', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing token / not admin', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Credit request not found', type: ErrorResponseDto })
  async reject(
    @CurrentUser() reqUser: RequestUser,
    @Param('id') id: string,
    @Body() dto: RejectCreditRequestDto,
  ) {
    return this.creditRequestsService.reject(id, reqUser.id, dto.admin_notes);
  }

  /**
   * Returns all log entries for a credit request (requested, approved, rejected).
   * @param id - Credit request UUID (path)
   * @returns Array of CreditRequestLogEntry
   */
  @Get(':id/logs')
  @ApiOperation({ summary: 'Get log entries for a credit request (all transactions on this request)' })
  @ApiParam({ name: 'id', description: 'Credit request UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'List of log entries (requested, approved, rejected)', type: CreditRequestLogEntryDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Invalid or missing token / not admin', type: ErrorResponseDto })
  async getLogs(@Param('id') id: string) {
    return this.creditRequestsService.getLogs(id);
  }
}
