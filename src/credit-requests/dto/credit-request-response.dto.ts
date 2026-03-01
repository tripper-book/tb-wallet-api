import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Credit request entity as returned by API */
export class CreditRequestResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  user_id: string;
  @ApiProperty()
  amount_cents: string;
  @ApiProperty()
  currency: string;
  @ApiProperty({ example: 'pending_approval' })
  status: string;
  @ApiPropertyOptional()
  notes: string | null;
  @ApiPropertyOptional()
  admin_notes: string | null;
  @ApiPropertyOptional()
  reviewed_at: string | null;
  @ApiPropertyOptional()
  reviewed_by: string | null;
  @ApiProperty()
  created_at: string;
  @ApiProperty()
  updated_at: string;
  /** Present when fetching by ID (admin get details) */
  @ApiPropertyOptional({ description: 'User who made the request (included in GET by id)' })
  user?: { id: string; external_id: string; email: string | null; name: string | null };
}

/** List of credit requests response */
export class CreditRequestsListResponseDto {
  @ApiProperty({ type: [CreditRequestResponseDto] })
  items: CreditRequestResponseDto[];
  @ApiProperty()
  total: number;
}
