import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { Employee } from './employee.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly usersService: UsersService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    // Validate: if username/password provided, check username is available
    if (createEmployeeDto.username && createEmployeeDto.password) {
      const existing = await this.usersRepository.findOne({
        where: { username: createEmployeeDto.username },
      });
      if (existing) {
        throw new BadRequestException('Username already exists');
      }
    }

    // Validate: check email is not already used
    const existingEmail = await this.employeeRepository.findOne({
      where: { email: createEmployeeDto.email },
    });
    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    // Create user account if username/password provided
    let user: User | null = null;
    if (createEmployeeDto.username && createEmployeeDto.password) {
      const hashedPassword = await argon2.hash(createEmployeeDto.password, {
        type: argon2.argon2id,
      });
      user = this.usersRepository.create({
        username: createEmployeeDto.username,
        password: hashedPassword,
        fullName: createEmployeeDto.fullName,
        phone: createEmployeeDto.phone,
        role: createEmployeeDto.role,
      });
      await this.usersRepository.save(user);
    }

    // Create employee
    const employee = this.employeeRepository.create({
      fullName: createEmployeeDto.fullName,
      email: createEmployeeDto.email,
      phone: createEmployeeDto.phone ?? null,
      position: createEmployeeDto.position ?? null,
      department: createEmployeeDto.department ?? null,
      salary: createEmployeeDto.salary ?? null,
      isActive: createEmployeeDto.isActive ?? true,
      user,
    });

    return this.employeeRepository.save(employee);
  }

  async findAll(): Promise<Employee[]> {
    return this.employeeRepository.find({
      order: { createdAt: 'DESC' },
      relations: { user: true },
    });
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id);

    if (updateEmployeeDto.userId !== undefined) {
      if (updateEmployeeDto.userId === null) {
        employee.user = null;
      } else {
        const user = await this.usersRepository.findOne({
          where: { id: updateEmployeeDto.userId },
        });
        if (!user) {
          throw new NotFoundException(`User with id ${updateEmployeeDto.userId} not found`);
        }
        employee.user = user;
      }
    }

    const { userId, ...rest } = updateEmployeeDto;
    Object.assign(employee, rest);
    return this.employeeRepository.save(employee);
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepository.remove(employee);
  }

  async resetPassword(
    id: string,
    newPassword?: string,
  ): Promise<{ message: string; newPassword: string }> {
    const employee = await this.findOne(id);

    if (!employee.user) {
      throw new BadRequestException(
        `Employee with id ${id} has no associated user account`,
      );
    }

    const password = newPassword ?? this.generateRandomPassword();
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
    });
    await this.usersService.updatePassword(employee.user.id, hashedPassword);

    return { message: 'Password reset successfully', newPassword: password };
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'A1' + password;
  }
}
