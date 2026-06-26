import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from '../menus/menu.entity';
import { MenuItem } from './menu-item.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async create(createMenuItemDto: CreateMenuItemDto): Promise<MenuItem> {
    const menu = await this.menuRepository.findOne({
      where: { id: createMenuItemDto.menuId },
    });
    if (!menu) {
      throw new NotFoundException(
        `Menu with id ${createMenuItemDto.menuId} not found`,
      );
    }

    const menuItem = this.menuItemRepository.create({
      ...createMenuItemDto,
      menu,
    });
    return this.menuItemRepository.save(menuItem);
  }

  async findAll(): Promise<MenuItem[]> {
    return this.menuItemRepository.find({
      relations: ['menu'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MenuItem> {
    const menuItem = await this.menuItemRepository.findOne({
      where: { id },
      relations: ['menu'],
    });
    if (!menuItem) {
      throw new NotFoundException(`MenuItem with id ${id} not found`);
    }
    return menuItem;
  }

  async update(
    id: string,
    updateMenuItemDto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    const menuItem = await this.findOne(id);

    if (updateMenuItemDto.menuId) {
      const menu = await this.menuRepository.findOne({
        where: { id: updateMenuItemDto.menuId },
      });
      if (!menu) {
        throw new NotFoundException(
          `Menu with id ${updateMenuItemDto.menuId} not found`,
        );
      }
      menuItem.menu = menu;
    }

    Object.assign(menuItem, updateMenuItemDto);
    return this.menuItemRepository.save(menuItem);
  }

  async remove(id: string): Promise<void> {
    const menuItem = await this.findOne(id);
    await this.menuItemRepository.remove(menuItem);
  }
}
