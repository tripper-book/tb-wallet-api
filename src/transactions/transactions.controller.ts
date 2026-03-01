import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { TransactionsListResponseDto, ErrorResponseDto } from '../common/dto/api-responses.dto';
import { UsersService } from '../users/users.service';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
export class TransactionsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
  ) {}

  /**
   * Returns paginated transaction log for the authenticated user (audit trail).
   * @param reqUser - Injected from Bearer token
   * @param limit - Max items (default 20, max 100)
   * @param offset - Pagination offset
   * @returns { items: Transaction[], total: number }
   */
  @Get()
  @ApiOperation({ summary: 'Transaction logs per user (audit trail)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max items to return (default 20, max 100)', example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Pagination offset', example: 0 })
  @ApiResponse({ status: 200, description: 'List of transactions', type: TransactionsListResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing token', type: ErrorResponseDto })
  async list(
    @CurrentUser() reqUser: RequestUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const user = await this.usersService.getOrCreateFromRequestUser(reqUser);
    return this.transactionsService.findByUserId(user.id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}
