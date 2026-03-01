import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

/**
 * Generic payment gateway/PSP config. Swap mock for real provider per provider_id.
 */
@Entity('payment_providers')
export class PaymentProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** e.g. mock, hdfc_avenue, razorpay */
  @Column({ type: 'varchar', length: 50 })
  type: string;

  /** Provider-specific config (keys, endpoints). Not used by mock. */
  @Column({ type: 'json', nullable: true })
  config: Record<string, unknown> | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Order, (o) => o.provider)
  orders: Order[];
}
