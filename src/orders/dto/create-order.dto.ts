import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: '10000', description: 'Amount in smallest unit (paise)' })
  @IsString()
  amount_cents: string;

  @ApiPropertyOptional({ default: 'INR' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Payment provider ID (default: first active mock provider)' })
  @IsOptional()
  @IsString()
  provider_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class CreateOrderResponseDto {
  @ApiProperty({ description: 'Order UUID' })
  order_id: string;
  @ApiProperty({ description: 'Order status', example: 'created' })
  status: string;
  @ApiPropertyOptional({ description: 'PSP order identifier' })
  psp_order_id?: string;
  @ApiPropertyOptional({ description: 'Token for payment redirect' })
  psp_token?: string;
  @ApiPropertyOptional({ description: 'URL to redirect user for payment' })
  redirect_url?: string;
}
