import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { User } from '../users/user.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const employee = this.employeeRepository.create({
      fullName: createEmployeeDto.fullName,
      email: createEmployeeDto.email,
      phone: createEmployeeDto.phone ?? null,
      position: createEmployeeDto.position ?? null,
      department: createEmployeeDto.department ?? null,
      salary: createEmployeeDto.salary ?? null,
      isActive: createEmployeeDto.isActive ?? true,
    });

    if (createEmployeeDto.userId) {
      const user = await this.usersRepository.findOne({
        where: { id: createEmployeeDto.userId },
      });
      if (!user) {
        throw new NotFoundException(`User with id ${createEmployeeDto.userId} not found`);
      }
      employee.user = user;
    }

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
}
