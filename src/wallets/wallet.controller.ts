import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { WalletBalanceResponseDto, DebitForBookingResponseDto, ErrorResponseDto } from '../common/dto/api-responses.dto';
import { UsersService } from '../users/users.service';
import { WalletService } from './wallets.service';
import { DebitForBookingDto } from './dto/debit-for-booking.dto';
import { TransactionReferenceType } from '../transactions/entities/transaction-type.enum';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(AuthGuard)
@ApiBearerAuth('access-token')
export class WalletController {
  constructor(
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Returns wallet balance for the authenticated user (checkout flow step 2–3).
   * @param reqUser - Injected from Bearer token
   * @returns { balance_cents, currency }
   */
  @Get('balance')
  @ApiOperation({ summary: 'Check wallet balance (Checkout flow step 2–3)' })
  @ApiResponse({ status: 200, description: 'Wallet balance', type: WalletBalanceResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing token', type: ErrorResponseDto })
  async getBalance(@CurrentUser() reqUser: RequestUser): Promise<WalletBalanceResponseDto> {
    const user = await this.usersService.getOrCreateFromRequestUser(reqUser);
    return this.walletService.getBalance(user.id);
  }

  /**
   * Debits the wallet for a booking (step 8). Logs a transaction. Fails if insufficient balance.
   * @param reqUser - Injected from Bearer token
   * @param dto - amount_cents (paise), reference_id (booking/order ref)
   * @returns { balance_after_cents }
   */
  @Post('debit-for-booking')
  @ApiOperation({ summary: 'Debit wallet on booking success (step 8: reduce balance)' })
  @ApiBody({
    description: 'Amount to debit (paise) and booking/order reference.',
    examples: {
      default: { summary: 'Debit ₹50 for a booking', value: { amount_cents: '5000', reference_id: 'booking-123' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Balance reduced, transaction logged', type: DebitForBookingResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient balance or validation error', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing token', type: ErrorResponseDto })
  async debitForBooking(@CurrentUser() reqUser: RequestUser, @Body() dto: DebitForBookingDto): Promise<DebitForBookingResponseDto> {
    const user = await this.usersService.getOrCreateFromRequestUser(reqUser);
    const newBalance = await this.walletService.debit(
      user.id,
      dto.amount_cents,
      TransactionReferenceType.ORDER,
      dto.reference_id,
    );
    return { balance_after_cents: newBalance };
  }
}
