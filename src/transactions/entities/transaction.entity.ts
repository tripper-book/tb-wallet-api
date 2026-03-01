import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  TransactionReferenceType,
  TransactionType,
} from './transaction-type.enum';

/**
 * Transaction log per user for audit and balance history.
 */
@Entity('transactions')
@Index(['user_id', 'created_at'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  /** Amount in smallest unit (e.g. paise). Positive for both credit and debit. */
  @Column({ name: 'amount_cents', type: 'bigint' })
  amount_cents: string;

  /** Balance after this transaction (for audit trail). */
  @Column({ name: 'balance_after_cents', type: 'bigint', nullable: true })
  balance_after_cents: string | null;

  @Column({
    name: 'reference_type',
    type: 'enum',
    enum: TransactionReferenceType,
    nullable: true,
  })
  reference_type: TransactionReferenceType | null;

  @Column({ name: 'reference_id', type: 'varchar', length: 255, nullable: true })
  reference_id: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
