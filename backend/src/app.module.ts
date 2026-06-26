import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menus/menu.module';
import { EmployeeModule } from './employees/employee.module';
import { MenuItemModule } from './menu-items/menu-item.module';
import { OrderModule } from './orders/order.module';
import { TableModule } from './tables/table.module';
import { UsersModule } from './users/users.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    // Load .env file
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Connect to MySQL
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
      connectTimeout: 10000,
    }),
    MenuModule,
    EmployeeModule,
    OrderModule,
    UsersModule,
    MenuItemModule,
    AuthModule,
    TableModule,
  ],
})
export class AppModule {}