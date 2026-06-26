import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { MenuItemModule } from '../menu-items/menu-item.module';
import { UsersModule } from '../users/users.module';
import { TableModule } from '../tables/table.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    MenuItemModule,
    UsersModule,
    TableModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrderModule {}
