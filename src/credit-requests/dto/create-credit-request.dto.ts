import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCreditRequestDto {
  @ApiProperty({ example: '50000', description: 'Amount in smallest unit (paise)' })
  @IsString()
  @MinLength(1)
  amount_cents: string;

  @ApiPropertyOptional({ default: 'INR' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'User note for the request' })
  @IsOptional()
  @IsString()
  notes?: string;
}
