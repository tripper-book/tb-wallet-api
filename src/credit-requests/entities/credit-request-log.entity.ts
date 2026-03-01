import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreditRequest } from './credit-request.entity';
import { CreditRequestLogAction } from './credit-request-status.enum';

/**
 * Log table for all credit request state changes (requested, approved, rejected).
 */
@Entity('credit_request_logs')
export class CreditRequestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'credit_request_id', type: 'uuid' })
  credit_request_id: string;

  @ManyToOne(() => CreditRequest, (cr) => cr.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'credit_request_id' })
  credit_request: CreditRequest;

  @Column({ type: 'varchar', length: 50 })
  action: CreditRequestLogAction;

  @Column({ name: 'performed_by', type: 'varchar', length: 255 })
  performed_by: string;

  @Column({ name: 'old_status', type: 'varchar', length: 50, nullable: true })
  old_status: string | null;

  @Column({ name: 'new_status', type: 'varchar', length: 50, nullable: true })
  new_status: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
