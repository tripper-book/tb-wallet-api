import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';

/**
 * Cached/synced user from tb-backend-service. Used for transaction logs and wallet ownership.
 */
@Entity('users')
@Unique(['external_id'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** ID from tb-backend-service */
  @Column({ name: 'external_id', type: 'varchar', length: 255 })
  external_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Wallet, (w) => w.user)
  wallets: Wallet[];

  @OneToMany(() => Transaction, (t) => t.user)
  transactions: Transaction[];

  @OneToMany(() => Order, (o) => o.user)
  orders: Order[];
}
