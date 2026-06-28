import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import http from 'node:http';
import { AppModule } from '../src/app.module';
import request from 'supertest';

export interface E2ESetup {
  app: INestApplication;
  server: http.Server;
  dataSource: DataSource;
  token: string;
  userId: string;
}

export async function clearNonUserTables(dataSource: DataSource) {
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of [
    'payment_requests',
    'order_items',
    'orders',
    'products',
    'categories',
    'tables',
    'employees',
  ]) {
    await dataSource.query(`DELETE FROM \`${table}\``);
  }
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}

export async function setupApp(): Promise<E2ESetup> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const dataSource = app.get(DataSource);
  const server = app.getHttpServer();

  await clearNonUserTables(dataSource);

  const res = await request(server)
    .post('/auth/register')
    .send({
      username: `e2e_shared_${Date.now()}`,
      password: 'Test1234',
      fullName: 'E2E Shared User',
    })
    .expect(201);

  return {
    app,
    server,
    dataSource,
    token: res.body.accessToken,
    userId: res.body.user.id,
  };
}
