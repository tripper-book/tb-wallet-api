import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DebitForBookingDto {
  @ApiProperty({ example: '5000', description: 'Amount in smallest unit (paise)' })
  @IsString()
  amount_cents: string;

  @ApiProperty({ example: 'booking-123', description: 'Order or booking reference ID' })
  @IsString()
  reference_id: string;
}
