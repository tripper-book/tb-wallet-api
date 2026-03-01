import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionReferenceType, TransactionType } from '../transactions/entities/transaction-type.enum';
import { TransactionsService } from '../transactions/transactions.service';
import { User } from '../users/entities/user.entity';
import { Wallet } from './entities/wallet.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly transactionsService: TransactionsService,
  ) {}

  async getOrCreateWallet(userId: string, currency = 'INR'): Promise<Wallet> {
    let wallet = await this.walletRepo.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
    if (!wallet) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      wallet = this.walletRepo.create({ user_id: userId, currency, balance_cents: '0' });
      await this.walletRepo.save(wallet);
    }
    return wallet;
  }

  async getBalance(userId: string, currency = 'INR'): Promise<{ balance_cents: string; currency: string }> {
    const wallet = await this.getOrCreateWallet(userId, currency);
    return { balance_cents: wallet.balance_cents, currency: wallet.currency };
  }

  /** Debit wallet (e.g. on booking success). Returns new balance. */
  async debit(userId: string, amountCents: string, referenceType: string, referenceId: string): Promise<string> {
    const wallet = await this.getOrCreateWallet(userId);
    const current = BigInt(wallet.balance_cents);
    const amount = BigInt(amountCents);
    if (current < amount) {
      throw new Error('Insufficient balance');
    }
    const newBalance = (current - amount).toString();
    wallet.balance_cents = newBalance;
    await this.walletRepo.save(wallet);
    await this.transactionsService.log(
      userId,
      TransactionType.DEBIT,
      amountCents,
      newBalance,
      referenceType as TransactionReferenceType,
      referenceId,
      null,
    );
    return newBalance;
  }

  /** Credit wallet (e.g. add to wallet after PSP success). Returns new balance. */
  async credit(userId: string, amountCents: string, referenceType: string, referenceId: string): Promise<string> {
    const wallet = await this.getOrCreateWallet(userId);
    const newBalance = (BigInt(wallet.balance_cents) + BigInt(amountCents)).toString();
    wallet.balance_cents = newBalance;
    await this.walletRepo.save(wallet);
    await this.transactionsService.log(
      userId,
      TransactionType.CREDIT,
      amountCents,
      newBalance,
      referenceType as TransactionReferenceType,
      referenceId,
      null,
    );
    return newBalance;
  }
}
