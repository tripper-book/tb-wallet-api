import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveCreditRequestDto {
  @ApiPropertyOptional({ description: 'Admin note (e.g. reason or reference)' })
  @IsOptional()
  @IsString()
  admin_notes?: string;
}

export class RejectCreditRequestDto {
  @ApiPropertyOptional({ description: 'Reason for rejection' })
  @IsOptional()
  @IsString()
  admin_notes?: string;
}
