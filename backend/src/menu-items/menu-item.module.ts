import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuModule } from '../menus/menu.module';
import { MenuItemController } from './menu-item.controller';
import { MenuItemService } from './menu-item.service';
import { MenuItem } from './menu-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem]), MenuModule],
  controllers: [MenuItemController],
  providers: [MenuItemService],
  exports: [TypeOrmModule],
})
export class MenuItemModule {}
