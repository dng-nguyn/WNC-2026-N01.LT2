import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TableStatus } from './table-status.enum';

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'table_number', type: 'varchar', length: 20, unique: true })
  tableNumber: string;

  @Column({ type: 'enum', enum: TableStatus, default: TableStatus.EMPTY })
  status: TableStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
