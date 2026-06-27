import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Cafe Backend E2E', () => {
  let app: INestApplication;
  let token: string;
  let userId: string;
  let menuId: string;
  let menuItemId: string;
  let tableId: string;
  let paymentId: string;
  let orderId: string;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // ── Auth ──────────────────────────────────────────────

  describe('Auth', () => {
    const username = `e2e_${Date.now()}`;

    it('POST /auth/register — creates user and returns token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username, password: 'Test1234', fullName: 'E2E Tester' })
        .expect(201);

      expect(res.body.message).toBe('Registration successful');
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.user.username).toBe(username);
      expect(res.body.user.id).toBeTruthy();

      token = res.body.accessToken;
      userId = res.body.user.id;
    });

    it('POST /auth/register — rejects duplicate username', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username, password: 'Test1234' })
        .expect(409);
    });

    it('POST /auth/register — rejects short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'baduser', password: 'ab' })
        .expect(400);
    });

    it('POST /auth/login — logs in and returns token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username, password: 'Test1234' })
        .expect(201);

      expect(res.body.accessToken).toBeTruthy();
    });

    it('POST /auth/login — rejects wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username, password: 'WrongPass1' })
        .expect(401);
    });

    it('GET /auth/profile — returns authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.user.username).toBe(username);
    });

    it('GET /auth/profile — rejects unauthenticated', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });

  // ── Menus ─────────────────────────────────────────────

  describe('Menus', () => {
    it('POST /menus — creates a menu', async () => {
      const res = await request(app.getHttpServer())
        .post('/menus')
        .send({ name: `Coffee_${Date.now()}`, description: 'Hot drinks' })
        .expect(201);

      expect(res.body.name).toBeTruthy();
      expect(res.body.id).toBeTruthy();
      menuId = res.body.id;
    });

    it('POST /menus — rejects empty name', async () => {
      await request(app.getHttpServer())
        .post('/menus')
        .send({ name: '' })
        .expect(400);
    });

    it('GET /menus — returns array', async () => {
      const res = await request(app.getHttpServer())
        .get('/menus')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /menus/:id — returns menu by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/menus/${menuId}`)
        .expect(200);

      expect(res.body.id).toBe(menuId);
    });

    it('GET /menus/:id — 404 on unknown', async () => {
      await request(app.getHttpServer())
        .get('/menus/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('PATCH /menus/:id — updates menu', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/menus/${menuId}`)
        .send({ description: 'Updated desc' })
        .expect(200);

      expect(res.body.description).toBe('Updated desc');
    });

    it('DELETE /menus/:id — deletes menu', async () => {
      await request(app.getHttpServer())
        .delete(`/menus/${menuId}`)
        .expect(200);
    });

    it('GET /menus/:id — 404 after delete', async () => {
      await request(app.getHttpServer())
        .get(`/menus/${menuId}`)
        .expect(404);
    });
  });

  // ── Menu Items ────────────────────────────────────────

  describe('Menu Items', () => {
    let freshMenuId: string;

    beforeAll(async () => {
      // Create a fresh menu since we deleted the previous one
      const res = await request(app.getHttpServer())
        .post('/menus')
        .send({ name: `MenuForItems_${Date.now()}` });
      freshMenuId = res.body.id;
    });

    it('POST /menu-items — creates a menu item', async () => {
      const res = await request(app.getHttpServer())
        .post('/menu-items')
        .send({ menuId: freshMenuId, name: 'Espresso', price: 3.5 })
        .expect(201);

      expect(res.body.name).toBe('Espresso');
      expect(Number(res.body.price)).toBe(3.5);
      expect(res.body.menu.id).toBe(freshMenuId);
      menuItemId = res.body.id;
    });

    it('POST /menu-items — rejects missing menuId', async () => {
      await request(app.getHttpServer())
        .post('/menu-items')
        .send({ name: 'Latte', price: 4.0 })
        .expect(400);
    });

    it('POST /menu-items — rejects negative price', async () => {
      await request(app.getHttpServer())
        .post('/menu-items')
        .send({ menuId: freshMenuId, name: 'Bad', price: -1 })
        .expect(400);
    });

    it('POST /menu-items — 404 on unknown menu', async () => {
      await request(app.getHttpServer())
        .post('/menu-items')
        .send({
          menuId: '00000000-0000-0000-0000-000000000000',
          name: 'Nope',
          price: 5,
        })
        .expect(404);
    });

    it('GET /menu-items — returns array with menu relation', async () => {
      const res = await request(app.getHttpServer())
        .get('/menu-items')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0].menu).toBeDefined();
      }
    });

    it('GET /menu-items/:id — returns item', async () => {
      const res = await request(app.getHttpServer())
        .get(`/menu-items/${menuItemId}`)
        .expect(200);

      expect(res.body.id).toBe(menuItemId);
    });

    it('PATCH /menu-items/:id — updates price', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/menu-items/${menuItemId}`)
        .send({ price: 4.0 })
        .expect(200);

      expect(Number(res.body.price)).toBe(4.0);
    });

    it('DELETE /menu-items/:id — deletes item', async () => {
      await request(app.getHttpServer())
        .delete(`/menu-items/${menuItemId}`)
        .expect(200);
    });
  });

  // ── Tables ────────────────────────────────────────────

  describe('Tables', () => {
    it('POST /tables — creates a table', async () => {
      const res = await request(app.getHttpServer())
        .post('/tables')
        .send({ tableNumber: `T${Date.now()}` })
        .expect(201);

      expect(res.body.tableNumber).toBeTruthy();
      expect(res.body.status).toBe('EMPTY');
      tableId = res.body.id;
    });

    it('POST /tables — sets status on create', async () => {
      const res = await request(app.getHttpServer())
        .post('/tables')
        .send({ tableNumber: `T2_${Date.now()}`, status: 'RESERVED' })
        .expect(201);

      expect(res.body.status).toBe('RESERVED');
    });

    it('POST /tables — rejects invalid status', async () => {
      await request(app.getHttpServer())
        .post('/tables')
        .send({ tableNumber: 'Bad', status: 'BROKEN' })
        .expect(400);
    });

    it('GET /tables — returns array', async () => {
      const res = await request(app.getHttpServer())
        .get('/tables')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('PATCH /tables/:id — updates status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/tables/${tableId}`)
        .send({ status: 'OCCUPIED' })
        .expect(200);

      expect(res.body.status).toBe('OCCUPIED');
    });

    it('DELETE /tables/:id — deletes table', async () => {
      await request(app.getHttpServer())
        .delete(`/tables/${tableId}`)
        .expect(200);
    });
  });

  // ── Orders ────────────────────────────────────────────

  describe('Orders', () => {
    let orderTableId: string;
    let orderMenuItemId: string;
    let orderMenuId: string;

    beforeAll(async () => {
      // Create prerequisites for order tests
      const menuRes = await request(app.getHttpServer())
        .post('/menus')
        .send({ name: `OrderMenu_${Date.now()}` });
      orderMenuId = menuRes.body.id;

      const itemRes = await request(app.getHttpServer())
        .post('/menu-items')
        .send({ menuId: orderMenuId, name: 'Cappuccino', price: 4.5 });
      orderMenuItemId = itemRes.body.id;

      const tableRes = await request(app.getHttpServer())
        .post('/tables')
        .send({ tableNumber: `OrderT_${Date.now()}` });
      orderTableId = tableRes.body.id;
    });

    it('POST /orders — creates order with items', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId,
          tableId: orderTableId,
          items: [{ menuItemId: orderMenuItemId, quantity: 2, note: 'no sugar' }],
        })
        .expect(201);

      expect(res.body.id).toBeTruthy();
      expect(res.body.status).toBe('PENDING');
      expect(res.body.user.id).toBe(userId);
      expect(res.body.table.id).toBe(orderTableId);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].quantity).toBe(2);
      expect(res.body.items[0].note).toBe('no sugar');
      expect(Number(res.body.totalAmount)).toBe(9.0); // 2 × 4.5
      orderId = res.body.id;
    });

    it('POST /orders — rejects missing userId', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({ items: [{ menuItemId: orderMenuItemId, quantity: 1 }] })
        .expect(400);
    });

    it('POST /orders — rejects empty items array', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({ userId, items: [] })
        .expect(400);
    });

    it('POST /orders — 404 on unknown user', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: '00000000-0000-0000-0000-000000000000',
          items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
        })
        .expect(404);
    });

    it('POST /orders — 404 on unknown menuItem', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId,
          items: [{ menuItemId: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
        })
        .expect(404);
    });

    it('GET /orders — returns array with relations', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /orders/:id — returns full order with items populated', async () => {
      const res = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .expect(200);

      expect(res.body.id).toBe(orderId);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.items[0].menuItem).toBeDefined();
      expect(res.body.items[0].menuItem.name).toBe('Cappuccino');
    });

    it('PATCH /orders/:id — updates status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect(res.body.status).toBe('CONFIRMED');
    });

    it('PATCH /orders/:id — rejects invalid status', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .send({ status: 'SHIPPED' })
        .expect(400);
    });

    it('POST /orders/:id/items — adds item to existing order', async () => {
      const res = await request(app.getHttpServer())
        .post(`/orders/${orderId}/items`)
        .send({ menuItemId: orderMenuItemId, quantity: 1, note: 'extra hot' })
        .expect(201);

      expect(res.body.items.length).toBe(2);
      // total should be 3 × 4.5 = 13.5
      expect(Number(res.body.totalAmount)).toBe(13.5);
      expect(res.body.items[1].note).toBe('extra hot');
    });

    it('POST /orders/:id/items — 404 on unknown menuItem', async () => {
      await request(app.getHttpServer())
        .post(`/orders/${orderId}/items`)
        .send({ menuItemId: '00000000-0000-0000-0000-000000000000', quantity: 1 })
        .expect(404);
    });

    it('DELETE /orders/:id — deletes order (cascades to items)', async () => {
      await request(app.getHttpServer())
        .delete(`/orders/${orderId}`)
        .expect(200);
    });

    it('GET /orders/:id — 404 after delete', async () => {
      await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .expect(404);
    });

    it('POST /orders — creates order without table (takeaway)', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId,
          items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
        })
        .expect(201);

      expect(res.body.table).toBeNull();
    });
  });

  // ── Payments ──────────────────────────────────────────

  describe('Payments', () => {
    let paymentOrderId: string;
    let paymentMenuId: string;
    let paymentMenuItemId: string;

    beforeAll(async () => {
      // Create prerequisites for payment tests
      const menuRes = await request(app.getHttpServer())
        .post('/menus')
        .send({ name: `PayMenu_${Date.now()}` });
      paymentMenuId = menuRes.body.id;

      const itemRes = await request(app.getHttpServer())
        .post('/menu-items')
        .send({ menuId: paymentMenuId, name: 'Espresso', price: 2.5 });
      paymentMenuItemId = itemRes.body.id;

      const orderRes = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId,
          items: [{ menuItemId: paymentMenuItemId, quantity: 3 }],
        })
        .expect(201);
      paymentOrderId = orderRes.body.id;
    });

    it('POST /payments/qr — creates QR payment for an order', async () => {
      const res = await request(app.getHttpServer())
        .post('/payments/qr')
        .send({ orderId: paymentOrderId })
        .expect(201);

      expect(res.body.id).toBeTruthy();
      expect(res.body.code).toHaveLength(12);
      expect(res.body.amount).toBeGreaterThan(0);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.qrUrl).toContain('vietqr.app/img');
      expect(res.body.qrUrl).toContain('template=compact');
      expect(res.body.qrUrl).toContain('showinfo=true');
      expect(res.body.qrUrl).toContain(encodeURIComponent(res.body.code));
      expect(res.body.order.id).toBe(paymentOrderId);
      paymentId = res.body.id;
    });

    it('GET /payments/:id — returns payment details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/payments/${paymentId}`)
        .expect(200);

      expect(res.body.id).toBe(paymentId);
      expect(res.body.code).toHaveLength(12);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.order.id).toBe(paymentOrderId);
    });

    it('GET /payments/order/:orderId — returns payments for order', async () => {
      const res = await request(app.getHttpServer())
        .get(`/payments/order/${paymentOrderId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].id).toBe(paymentId);
    });

    it('POST /payments/:id/verify — fails when Sepay unreachable', async () => {
      // Sepay API is unreachable without valid credentials — expect 400
      await request(app.getHttpServer())
        .post(`/payments/${paymentId}/verify`)
        .expect(400);
    });

    it('POST /payments/qr — 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .post('/payments/qr')
        .send({ orderId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);
    });

    it('POST /payments/qr — rejects missing orderId', async () => {
      await request(app.getHttpServer())
        .post('/payments/qr')
        .send({})
        .expect(400);
    });
  });

  // ── Edge cases ────────────────────────────────────────

  describe('Edge cases', () => {
    it('GET /categories — 404 (renamed to /menus)', async () => {
      await request(app.getHttpServer())
        .get('/categories')
        .expect(404);
    });

    it('POST /menus — rejects non-JSON body', async () => {
      await request(app.getHttpServer())
        .post('/menus')
        .set('Content-Type', 'text/plain')
        .send('not json')
        .expect(400);
    });
  });
});
