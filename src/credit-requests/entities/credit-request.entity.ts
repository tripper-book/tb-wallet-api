import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CreditRequestLog } from './credit-request-log.entity';
import { CreditRequestStatus } from './credit-request-status.enum';

@Entity('credit_requests')
@Index(['user_id', 'created_at'])
export class CreditRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'amount_cents', type: 'bigint' })
  amount_cents: string;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ type: 'varchar', length: 50, default: 'pending_approval' })
  status: CreditRequestStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  admin_notes: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewed_at: Date | null;

  @Column({ name: 'reviewed_by', type: 'varchar', length: 255, nullable: true })
  reviewed_by: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => CreditRequestLog, (log) => log.credit_request)
  logs: CreditRequestLog[];
}
