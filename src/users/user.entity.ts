import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './user-role.enum';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50, unique: true })
  username!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ name: 'full_name', length: 100 })
  fullName!: string;

  @Column({ length: 15, nullable: true, type: 'varchar' })
  phone?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role!: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
