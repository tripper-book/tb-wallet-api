import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionReferenceType, TransactionType } from './entities/transaction-type.enum';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  async log(
    userId: string,
    type: TransactionType,
    amountCents: string,
    balanceAfterCents: string | null,
    referenceType: TransactionReferenceType | null,
    referenceId: string | null,
    metadata?: Record<string, unknown> | null,
  ): Promise<Transaction> {
    const tx = this.txRepo.create({
      user_id: userId,
      type,
      amount_cents: amountCents,
      balance_after_cents: balanceAfterCents,
      reference_type: referenceType,
      reference_id: referenceId,
      metadata: metadata ?? null,
    });
    return this.txRepo.save(tx);
  }

  async findByUserId(
    userId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ items: Transaction[]; total: number }> {
    const { limit = 20, offset = 0 } = options;
    const [items, total] = await this.txRepo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: Math.min(limit, 100),
      skip: offset,
    });
    return { items, total };
  }
}
