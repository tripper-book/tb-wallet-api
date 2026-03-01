import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Standard error response body */
export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiPropertyOptional({ example: 'Validation failed' })
  message?: string | string[];
}

/** Wallet balance response */
export class WalletBalanceResponseDto {
  @ApiProperty({ example: '0', description: 'Balance in smallest unit (paise)' })
  balance_cents: string;

  @ApiProperty({ example: 'INR' })
  currency: string;
}

/** Debit-for-booking response */
export class DebitForBookingResponseDto {
  @ApiProperty({ description: 'Wallet balance after debit (paise)' })
  balance_after_cents: string;
}

/** Transaction log item */
export class TransactionItemDto {
  @ApiProperty()
  id: string;
  @ApiProperty({ enum: ['credit', 'debit'] })
  type: string;
  @ApiProperty()
  amount_cents: string;
  @ApiPropertyOptional()
  balance_after_cents: string | null;
  @ApiPropertyOptional()
  reference_type: string | null;
  @ApiPropertyOptional()
  reference_id: string | null;
  @ApiPropertyOptional()
  metadata: Record<string, unknown> | null;
  @ApiProperty()
  created_at: string;
}

/** Transactions list response */
export class TransactionsListResponseDto {
  @ApiProperty({ type: [TransactionItemDto] })
  items: TransactionItemDto[];
  @ApiProperty()
  total: number;
}

/** Credit request log entry */
export class CreditRequestLogEntryDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  action: string;
  @ApiProperty()
  performed_by: string;
  @ApiPropertyOptional()
  old_status: string | null;
  @ApiPropertyOptional()
  new_status: string | null;
  @ApiPropertyOptional()
  notes: string | null;
  @ApiProperty()
  created_at: string;
}
