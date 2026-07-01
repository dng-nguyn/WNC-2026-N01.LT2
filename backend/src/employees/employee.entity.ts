import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'full_name', length: 100 })
  fullName: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 15, nullable: true, type: 'varchar' })
  phone: string | null;

  @Column({ length: 50, nullable: true, type: 'varchar' })
  position: string | null;

  @Column({ length: 50, nullable: true, type: 'varchar' })
  department: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salary: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
