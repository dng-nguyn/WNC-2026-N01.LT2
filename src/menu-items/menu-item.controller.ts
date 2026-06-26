import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { MenuItemService } from './menu-item.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItem } from './menu-item.entity';

@Controller('menu-items')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @Post()
  create(@Body() createMenuItemDto: CreateMenuItemDto): Promise<MenuItem> {
    return this.menuItemService.create(createMenuItemDto);
  }

  @Get()
  findAll(): Promise<MenuItem[]> {
    return this.menuItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<MenuItem> {
    return this.menuItemService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    return this.menuItemService.update(id, updateMenuItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.menuItemService.remove(id);
  }
}
