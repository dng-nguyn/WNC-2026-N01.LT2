import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../orders/order.entity';
import { Payment } from '../payments/payment.entity';
import { VerificationType } from './verification-type.enum';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Payment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment | null;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  amount: number;

  @Column({ name: 'verification_type', type: 'enum', enum: VerificationType })
  verificationType: VerificationType;

  @Column({ name: 'verified_at', type: 'timestamp' })
  verifiedAt: Date;

  @Column({ name: 'reverified_at', type: 'timestamp', nullable: true })
  reverifiedAt: Date | null;

  @Column({ name: 'sepay_transaction_id', type: 'varchar', length: 36, nullable: true })
  sepayTransactionId: string | null;

  @Column({ name: 'immudb_tx_id', type: 'bigint', nullable: true })
  immudbTxId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
