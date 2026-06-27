import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menus/menu.module';
import { EmployeeModule } from './employees/employee.module';
import { MenuItemModule } from './menu-items/menu-item.module';
import { OrderModule } from './orders/order.module';
import { TableModule } from './tables/table.module';
import { PaymentModule } from './payments/payment.module';
import { UsersModule } from './users/users.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    // Rate limiting - 100 requests per minute globally
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
    }),
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
      synchronize: process.env.NODE_ENV !== 'production',
      ssl: process.env.DB_SSL_CA
        ? { ca: process.env.DB_SSL_CA, rejectUnauthorized: true }
        : undefined,
      extra: {
        ssl: process.env.DB_SSL_CA
          ? { rejectUnauthorized: true }
          : { rejectUnauthorized: false },
      },
      connectTimeout: 10000,
    }),
    MenuModule,
    EmployeeModule,
    PaymentModule,
    OrderModule,
    UsersModule,
    MenuItemModule,
    AuthModule,
    TableModule,
  ],
})
export class AppModule {}