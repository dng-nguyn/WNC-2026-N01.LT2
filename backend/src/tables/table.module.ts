import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { Table } from './table.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Table])],
  controllers: [TableController],
  providers: [TableService],
  exports: [TypeOrmModule],
})
export class TableModule {}
