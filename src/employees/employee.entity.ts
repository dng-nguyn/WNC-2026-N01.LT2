import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 100 })
  fullName: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 15, nullable: true })
  phone: string | null;

  @Column({ length: 50, nullable: true })
  position: string | null;

  @Column({ length: 50, nullable: true })
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
