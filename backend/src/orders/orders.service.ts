import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderStatus } from './order-status.enum';
import { OrderItem } from './order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Table } from '../tables/table.entity';
import { TableStatus } from '../tables/table-status.enum';
import { User } from '../users/user.entity';
import { MenuItem } from '../menu-items/menu-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Table)
    private readonly tablesRepository: Repository<Table>,
    @InjectRepository(MenuItem)
    private readonly menuItemsRepository: Repository<MenuItem>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersRepository.manager.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: createOrderDto.userId },
      });
      if (!user) {
        throw new NotFoundException(
          `User with id ${createOrderDto.userId} not found`,
        );
      }

      let table: Table | null = null;
      if (createOrderDto.tableId) {
        table = await manager.findOne(Table, {
          where: { id: createOrderDto.tableId },
        });
        if (!table) {
          throw new NotFoundException(
            `Table with id ${createOrderDto.tableId} not found`,
          );
        }
      }

      const items: OrderItem[] = [];
      let totalAmount = 0;

      for (const itemDto of createOrderDto.items) {
        const menuItem = await manager.findOne(MenuItem, {
          where: { id: itemDto.menuItemId },
        });
        if (!menuItem) {
          throw new NotFoundException(
            `MenuItem with id ${itemDto.menuItemId} not found`,
          );
        }

        const orderItem = manager.create(OrderItem, {
          menuItem,
          quantity: itemDto.quantity,
          price: Number(menuItem.price),
          note: itemDto.note ?? null,
        });
        items.push(orderItem);
        totalAmount += orderItem.quantity * Number(orderItem.price);
      }

      const order = manager.create(Order, {
        user,
        table,
        items,
        totalAmount,
      });

      const savedOrder = await manager.save(order);

      // Update table status if assigned
      if (table) {
        table.status = TableStatus.OCCUPIED;
        await manager.save(table);
      }

      return savedOrder;
    });
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      order: { createdAt: 'DESC' },
      relations: { table: true, user: true, items: { menuItem: true } },
    });
  }

  async findActive(): Promise<Order[]> {
    return this.ordersRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem')
      .where('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING],
      })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { table: true, user: true, items: { menuItem: true } },
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    if (updateOrderDto.tableId) {
      const table = await this.tablesRepository.findOne({
        where: { id: updateOrderDto.tableId },
      });
      if (!table) {
        throw new NotFoundException(
          `Table with id ${updateOrderDto.tableId} not found`,
        );
      }
      order.table = table;
    }

    if (updateOrderDto.status) {
      order.status = updateOrderDto.status;
    }

    return this.ordersRepository.save(order);
  }

  async addItem(
    orderId: string,
    dto: CreateOrderItemDto,
  ): Promise<Order> {
    const order = await this.findOne(orderId);

    const menuItem = await this.menuItemsRepository.findOne({
      where: { id: dto.menuItemId },
    });
    if (!menuItem) {
      throw new NotFoundException(
        `MenuItem with id ${dto.menuItemId} not found`,
      );
    }

    const orderItem = this.orderItemsRepository.create({
      order,
      menuItem,
      quantity: dto.quantity,
      price: Number(menuItem.price),
      note: dto.note ?? null,
    });

    order.items.push(orderItem);
    order.totalAmount =
      Number(order.totalAmount) +
      orderItem.quantity * Number(orderItem.price);

    return this.ordersRepository.save(order);
  }

  async updateItem(
    orderId: string,
    itemId: string,
    dto: UpdateOrderItemDto,
  ): Promise<Order> {
    const order = await this.findOne(orderId);

    const itemIndex = order.items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) {
      throw new NotFoundException(
        `OrderItem with id ${itemId} not found in order ${orderId}`,
      );
    }

    const item = order.items[itemIndex];

    // Calculate price difference for total amount update
    const oldSubtotal = item.quantity * Number(item.price);

    if (dto.quantity !== undefined) {
      item.quantity = dto.quantity;
    }
    if (dto.note !== undefined) {
      item.note = dto.note;
    }

    const newSubtotal = item.quantity * Number(item.price);
    order.totalAmount =
      Number(order.totalAmount) - oldSubtotal + newSubtotal;

    await this.orderItemsRepository.save(item);
    return this.ordersRepository.save(order);
  }

  async removeItem(orderId: string, itemId: string): Promise<Order> {
    const order = await this.findOne(orderId);

    const itemIndex = order.items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) {
      throw new NotFoundException(
        `OrderItem with id ${itemId} not found in order ${orderId}`,
      );
    }

    const item = order.items[itemIndex];
    const itemSubtotal = item.quantity * Number(item.price);

    order.items.splice(itemIndex, 1);
    order.totalAmount = Number(order.totalAmount) - itemSubtotal;

    await this.orderItemsRepository.remove(item);
    return this.ordersRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.ordersRepository.remove(order);
  }
}