import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PaymentProvider } from '../../payment-providers/entities/payment-provider.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CREATED = 'created',   // order created with PSP
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'provider_id', type: 'uuid' })
  provider_id: string;

  @ManyToOne(() => PaymentProvider, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'provider_id' })
  provider: PaymentProvider;

  /** Amount in smallest unit (e.g. paise). */
  @Column({ name: 'amount_cents', type: 'bigint' })
  amount_cents: string;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'psp_order_id', type: 'varchar', length: 255, nullable: true })
  psp_order_id: string | null;

  @Column({ name: 'psp_token', type: 'varchar', length: 512, nullable: true })
  psp_token: string | null;

  @Column({ name: 'redirect_url', type: 'varchar', length: 2048, nullable: true })
  redirect_url: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
