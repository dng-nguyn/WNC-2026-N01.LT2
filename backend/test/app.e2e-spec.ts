import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import nock from 'nock';
import { AppModule } from '../src/app.module';
import request from 'supertest';

async function clearNonUserTables(dataSource: DataSource) {
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of ['payment_requests', 'order_items', 'orders', 'products', 'categories', 'tables', 'employees']) {
    await dataSource.query(`DELETE FROM \`${table}\``);
  }
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}

describe('Cafe Backend E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let server: any;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = app.get(DataSource);
    server = app.getHttpServer();
    await clearNonUserTables(dataSource);

    const res = await request(server)
      .post('/auth/register')
      .send({ username: `e2e_shared_${Date.now()}`, password: 'Test1234', fullName: 'E2E Shared User' })
      .expect(201);

    token = res.body.accessToken;
    userId = res.body.user.id;
  });

  afterAll(async () => {
    nock.cleanAll();
    if (app) await app.close();
  });

  // ── Auth ──────────────────────────────────────────────
  describe('Auth', () => {
    it('POST /auth/register — creates user and returns tokens', async () => {
      const username = `reg_${Date.now()}`;
      const res = await request(server)
        .post('/auth/register')
        .send({ username, password: 'Test1234', fullName: 'E2E Tester' })
        .expect(201);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
    });

    it('POST /auth/register — rejects duplicate username', async () => {
      const username = `dup_${Date.now()}`;
      await request(server).post('/auth/register').send({ username, password: 'Test1234', fullName: 'First' }).expect(201);
      await request(server).post('/auth/register').send({ username, password: 'Test1234', fullName: 'Second' }).expect(409);
    });

    it('POST /auth/register — rejects short username (<3)', async () => {
      await request(server).post('/auth/register').send({ username: 'ab', password: 'Test1234' }).expect(400);
    });

    it('POST /auth/register — rejects short password (<8)', async () => {
      await request(server).post('/auth/register').send({ username: `p_${Date.now()}`, password: 'Short1', fullName: 'X' }).expect(400);
    });

    it('POST /auth/register — rejects password without uppercase', async () => {
      await request(server).post('/auth/register').send({ username: `l_${Date.now()}`, password: 'lowercase1', fullName: 'X' }).expect(400);
    });

    it('POST /auth/register — rejects password without number', async () => {
      await request(server).post('/auth/register').send({ username: `n_${Date.now()}`, password: 'NoNumberHere', fullName: 'X' }).expect(400);
    });

    it('POST /auth/register — strips extra fields via whitelist', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send({ username: `strip_${Date.now()}`, password: 'Test1234', fullName: 'OK', hackerField: 'bad' })
        .expect(201);
      expect(res.body.user.hackerField).toBeUndefined();
    });

    it('POST /auth/login — authenticates and returns tokens', async () => {
      const username = `login_${Date.now()}`;
      await request(server).post('/auth/register').send({ username, password: 'Test1234', fullName: 'X' }).expect(201);
      const res = await request(server).post('/auth/login').send({ username, password: 'Test1234', fullName: 'X' }).expect(201);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
    });

    it('POST /auth/login — rejects wrong password', async () => {
      const username = `badpw_${Date.now()}`;
      await request(server).post('/auth/register').send({ username, password: 'Test1234', fullName: 'X' }).expect(201);
      await request(server).post('/auth/login').send({ username, password: 'WrongPass1' }).expect(401);
    });

    it('POST /auth/login — rejects password without uppercase', async () => {
      const username = `weak_${Date.now()}`;
      await request(server).post('/auth/register').send({ username, password: 'Test1234', fullName: 'X' }).expect(201);
      await request(server).post('/auth/login').send({ username, password: 'weak' }).expect(400);
    });

    it('GET /auth/profile — returns authenticated user with token', async () => {
      const res = await request(server).get('/auth/profile').set('Authorization', `Bearer ${token}`).expect(200);
      expect(res.body.user.username).toBeTruthy();
    });

    it('GET /auth/profile — returns 401 without token', async () => {
      await request(server).get('/auth/profile').expect(401);
    });

    it('GET /auth/profile — returns 401 with invalid token', async () => {
      await request(server).get('/auth/profile').set('Authorization', 'Bearer garbage').expect(401);
    });

    it('POST /auth/refresh — exchanges refresh token for new pair', async () => {
      const username = `ref_${Date.now()}`;
      const regRes = await request(server).post('/auth/register').send({ username, password: 'Test1234', fullName: 'X' }).expect(201);
      const res = await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: regRes.body.refreshToken })
        .expect(201);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
    });

    it('POST /auth/logout — confirms logout', async () => {
      const res = await request(server).post('/auth/logout').expect(201);
      expect(res.body.message).toBe('Logout successful');
    });
  });

  // ── Menus ─────────────────────────────────────────────
  describe('Menus', () => {
    it('POST /menus — creates a menu', async () => {
      const res = await request(server).post('/menus').send({ name: `M_${Date.now()}` }).expect(201);
      expect(res.body.name).toBeTruthy();
      expect(res.body.id).toBeTruthy();
    });

    it('POST /menus — rejects name >100 chars', async () => {
      await request(server).post('/menus').send({ name: 'a'.repeat(101) }).expect(400);
    });

    it('POST /menus — strips extra fields', async () => {
      const res = await request(server).post('/menus').send({ name: `Strip_${Date.now()}`, extra: 'nope' }).expect(201);
      expect(res.body.extra).toBeUndefined();
    });

    it('GET /menus — returns array', async () => {
      const res = await request(server).get('/menus').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /menus/:id — returns menu', async () => {
      const c = await request(server).post('/menus').send({ name: `Get_${Date.now()}` }).expect(201);
      const res = await request(server).get(`/menus/${c.body.id}`).expect(200);
      expect(res.body.id).toBe(c.body.id);
    });

    it('GET /menus/:id — 404 on unknown', async () => {
      await request(server).get('/menus/00000000-0000-0000-0000-000000000000').expect(404);
    });

    it('PATCH /menus/:id — updates menu', async () => {
      const c = await request(server).post('/menus').send({ name: `Patch_${Date.now()}` }).expect(201);
      const res = await request(server).patch(`/menus/${c.body.id}`).send({ description: 'New desc' }).expect(200);
      expect(res.body.description).toBe('New desc');
    });

    it('DELETE /menus/:id — cascade removes items', async () => {
      const m = await request(server).post('/menus').send({ name: `Del_${Date.now()}` }).expect(201);
      const i = await request(server).post('/menu-items').send({ menuId: m.body.id, name: 'Item', price: 1 }).expect(201);
      await request(server).delete(`/menus/${m.body.id}`).expect(200);
      await request(server).get(`/menus/${m.body.id}`).expect(404);
      await request(server).get(`/menu-items/${i.body.id}`).expect(404);
    });
  });

  // ── Menu Items ────────────────────────────────────────
  describe('Menu Items', () => {
    let freshMenuId: string;
    beforeAll(async () => {
      const r = await request(server).post('/menus').send({ name: `MI_${Date.now()}` }).expect(201);
      freshMenuId = r.body.id;
    });

    it('POST /menu-items — creates item', async () => {
      const res = await request(server).post('/menu-items').send({ menuId: freshMenuId, name: 'Espresso', price: 3.5 }).expect(201);
      expect(res.body.name).toBe('Espresso');
      expect(Number(res.body.price)).toBe(3.5);
    });

    it('POST /menu-items — rejects missing menuId', async () => {
      await request(server).post('/menu-items').send({ name: 'Latte', price: 4 }).expect(400);
    });

    it('POST /menu-items — rejects negative price', async () => {
      await request(server).post('/menu-items').send({ menuId: freshMenuId, name: 'Bad', price: -1 }).expect(400);
    });

    it('POST /menu-items — 404 on unknown menu', async () => {
      await request(server).post('/menu-items').send({ menuId: '00000000-0000-0000-0000-000000000000', name: 'Nope', price: 5 }).expect(404);
    });

    it('GET /menu-items/:id — returns item', async () => {
      const c = await request(server).post('/menu-items').send({ menuId: freshMenuId, name: `G_${Date.now()}`, price: 5 }).expect(201);
      const res = await request(server).get(`/menu-items/${c.body.id}`).expect(200);
      expect(res.body.id).toBe(c.body.id);
    });

    it('PATCH /menu-items/:id — updates price', async () => {
      const c = await request(server).post('/menu-items').send({ menuId: freshMenuId, name: `P_${Date.now()}`, price: 3 }).expect(201);
      const res = await request(server).patch(`/menu-items/${c.body.id}`).send({ price: 4 }).expect(200);
      expect(Number(res.body.price)).toBe(4);
    });

    it('DELETE /menu-items/:id — deletes item', async () => {
      const c = await request(server).post('/menu-items').send({ menuId: freshMenuId, name: `D_${Date.now()}`, price: 1 }).expect(201);
      await request(server).delete(`/menu-items/${c.body.id}`).expect(200);
      await request(server).get(`/menu-items/${c.body.id}`).expect(404);
    });
  });

  // ── Tables ────────────────────────────────────────────
  describe('Tables', () => {
    it('POST /tables — creates table', async () => {
      const res = await request(server).post('/tables').send({ tableNumber: `T${Date.now()}` }).expect(201);
      expect(res.body.status).toBe('EMPTY');
    });

    it('POST /tables — creates with status', async () => {
      const res = await request(server).post('/tables').send({ tableNumber: `TR_${Date.now()}`, status: 'RESERVED' }).expect(201);
      expect(res.body.status).toBe('RESERVED');
    });

    it('POST /tables — rejects invalid status', async () => {
      await request(server).post('/tables').send({ tableNumber: 'Bad', status: 'BROKEN' }).expect(400);
    });

    it('GET /tables — returns array', async () => {
      const res = await request(server).get('/tables').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('PATCH /tables/:id — updates status', async () => {
      const c = await request(server).post('/tables').send({ tableNumber: `PT_${Date.now()}` }).expect(201);
      const res = await request(server).patch(`/tables/${c.body.id}`).send({ status: 'OCCUPIED' }).expect(200);
      expect(res.body.status).toBe('OCCUPIED');
    });

    it('DELETE /tables/:id — deletes table', async () => {
      const c = await request(server).post('/tables').send({ tableNumber: `DT_${Date.now()}` }).expect(201);
      await request(server).delete(`/tables/${c.body.id}`).expect(200);
      await request(server).get(`/tables/${c.body.id}`).expect(404);
    });
  });

  // ── Orders ────────────────────────────────────────────
  describe('Orders', () => {
    let orderMenuItemId: string;
    let orderTableId: string;

    beforeAll(async () => {
      const menuRes = await request(server).post('/menus').send({ name: `OM_${Date.now()}` }).expect(201);
      const itemRes = await request(server).post('/menu-items').send({ menuId: menuRes.body.id, name: 'Cappuccino', price: 4.5 }).expect(201);
      orderMenuItemId = itemRes.body.id;
      const tableRes = await request(server).post('/tables').send({ tableNumber: `OT_${Date.now()}` }).expect(201);
      orderTableId = tableRes.body.id;
    });

    it('POST /orders — creates order with items and table', async () => {
      const res = await request(server).post('/orders').send({
        userId, tableId: orderTableId,
        items: [{ menuItemId: orderMenuItemId, quantity: 2, note: 'no sugar' }],
      }).expect(201);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].quantity).toBe(2);
      expect(Number(res.body.totalAmount)).toBe(9);
    });

    it('POST /orders — table status becomes OCCUPIED', async () => {
      const t = await request(server).post('/tables').send({ tableNumber: `OT2_${Date.now()}` }).expect(201);
      await request(server).post('/orders').send({
        userId, tableId: t.body.id,
        items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
      }).expect(201);
      const check = await request(server).get(`/tables/${t.body.id}`).expect(200);
      expect(check.body.status).toBe('OCCUPIED');
    });

    it('POST /orders — takeaway (no table)', async () => {
      const res = await request(server).post('/orders').send({
        userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
      }).expect(201);
      expect(res.body.table).toBeNull();
    });

    it('POST /orders — rejects missing userId', async () => {
      await request(server).post('/orders').send({ items: [{ menuItemId: orderMenuItemId, quantity: 1 }] }).expect(400);
    });

    it('POST /orders — rejects empty items', async () => {
      await request(server).post('/orders').send({ userId, items: [] }).expect(400);
    });

    it('POST /orders — 404 on unknown user', async () => {
      await request(server).post('/orders').send({
        userId: '00000000-0000-0000-0000-000000000000',
        items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
      }).expect(404);
    });

    it('POST /orders — 404 on unknown menuItem', async () => {
      await request(server).post('/orders').send({
        userId, items: [{ menuItemId: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
      }).expect(404);
    });

    it('GET /orders — returns array', async () => {
      const res = await request(server).get('/orders').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /orders/:id — returns order with items', async () => {
      const o = await request(server).post('/orders').send({
        userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
      }).expect(201);
      const res = await request(server).get(`/orders/${o.body.id}`).expect(200);
      expect(res.body.items[0].menuItem).toBeDefined();
    });

    it('PATCH /orders/:id — updates status', async () => {
      const o = await request(server).post('/orders').send({
        userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
      }).expect(201);
      const res = await request(server).patch(`/orders/${o.body.id}`).send({ status: 'CONFIRMED' }).expect(200);
      expect(res.body.status).toBe('CONFIRMED');
    });

    it('PATCH /orders/:id — rejects invalid status', async () => {
      const o = await request(server).post('/orders').send({
        userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
      }).expect(201);
      await request(server).patch(`/orders/${o.body.id}`).send({ status: 'SHIPPED' }).expect(400);
    });

    it('POST /orders/:id/items — adds item', async () => {
      const o = await request(server).post('/orders').send({
        userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
      }).expect(201);
      const res = await request(server).post(`/orders/${o.body.id}/items`)
        .send({ menuItemId: orderMenuItemId, quantity: 1, note: 'hot' }).expect(201);
      expect(res.body.items.length).toBe(2);
      expect(Number(res.body.totalAmount)).toBe(9);
    });

    it('POST /orders/:id/items — 404 on unknown menuItem', async () => {
      const o = await request(server).post('/orders').send({
        userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
      }).expect(201);
      await request(server).post(`/orders/${o.body.id}/items`)
        .send({ menuItemId: '00000000-0000-0000-0000-000000000000', quantity: 1 }).expect(404);
    });

    it('PATCH /orders/:id/items/:itemId — updates quantity', async () => {
      const o = await request(server).post('/orders').send({
        userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
      }).expect(201);
      const itemId = o.body.items[0].id;
      const res = await request(server).patch(`/orders/${o.body.id}/items/${itemId}`)
        .send({ quantity: 3 }).expect(200);
      expect(res.body.items[0].quantity).toBe(3);
      expect(Number(res.body.totalAmount)).toBe(13.5);
    });

    it('DELETE /orders/:id/items/:itemId — removes item', async () => {
      const o = await request(server).post('/orders').send({
        userId, items: [{ menuItemId: orderMenuItemId, quantity: 2 }],
      }).expect(201);
      const itemId = o.body.items[0].id;
      const res = await request(server).delete(`/orders/${o.body.id}/items/${itemId}`).expect(200);
      expect(res.body.items.length).toBe(0);
      expect(Number(res.body.totalAmount)).toBe(0);
    });

    it('DELETE /orders/:id — deletes order', async () => {
      const o = await request(server).post('/orders').send({
        userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
      }).expect(201);
      await request(server).delete(`/orders/${o.body.id}`).expect(200);
      await request(server).get(`/orders/${o.body.id}`).expect(404);
    });
  });

  // ── Payments ──────────────────────────────────────────
  describe('Payments', () => {
    let paymentMenuItemId: string;
    beforeAll(async () => {
      const m = await request(server).post('/menus').send({ name: `PM_${Date.now()}` }).expect(201);
      const i = await request(server).post('/menu-items').send({ menuId: m.body.id, name: 'Espresso', price: 2.5 }).expect(201);
      paymentMenuItemId = i.body.id;
    });

    it('POST /payments/qr — creates QR payment', async () => {
      const o = await request(server).post('/orders').send({
        userId, items: [{ menuItemId: paymentMenuItemId, quantity: 3 }],
      }).expect(201);
      const res = await request(server).post('/payments/qr').send({ orderId: o.body.id }).expect(201);
      expect(res.body.code).toHaveLength(12);
      expect(res.body.status).toBe('PENDING');
    });

    it('GET /payments/:id — returns payment details', async () => {
      const o = await request(server).post('/orders').send({
        userId, items: [{ menuItemId: paymentMenuItemId, quantity: 3 }],
      }).expect(201);
      const p = await request(server).post('/payments/qr').send({ orderId: o.body.id }).expect(201);
      const res = await request(server).get(`/payments/${p.body.id}`).expect(200);
      expect(res.body.status).toBe('PENDING');
    });

    it('GET /payments/order/:orderId — returns payments', async () => {
      const o = await request(server).post('/orders').send({
        userId, items: [{ menuItemId: paymentMenuItemId, quantity: 1 }],
      }).expect(201);
      const p = await request(server).post('/payments/qr').send({ orderId: o.body.id }).expect(201);
      const res = await request(server).get(`/payments/order/${o.body.id}`).expect(200);
      expect(res.body[0].id).toBe(p.body.id);
    });

    it('POST /payments/:id/verify — mocked Sepay updates payment and order', async () => {
      const o = await request(server).post('/orders').send({
        userId, items: [{ menuItemId: paymentMenuItemId, quantity: 2 }],
      }).expect(201);
      const p = await request(server).post('/payments/qr').send({ orderId: o.body.id }).expect(201);

      nock('https://userapi.sepay.vn')
        .get('/v2/transactions')
        .query(true)
        .reply(200, {
          transactions: [{
            id: 'tx-mock-999',
            amount_in: p.body.amount,
            transaction_content: p.body.code,
            transfer_type: 'in',
          }],
        });

      const res = await request(server).post(`/payments/${p.body.id}/verify`).expect(201);
      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.sepayTransactionId).toBe('tx-mock-999');

      const orderCheck = await request(server).get(`/orders/${o.body.id}`).expect(200);
      expect(orderCheck.body.status).toBe('COMPLETED');
    });

    it('POST /payments/qr — 404 on unknown order', async () => {
      await request(server).post('/payments/qr').send({ orderId: '00000000-0000-0000-0000-000000000000' }).expect(404);
    });

    it('POST /payments/qr — rejects missing orderId', async () => {
      await request(server).post('/payments/qr').send({}).expect(400);
    });
  });

  // ── Cascade ───────────────────────────────────────────
  describe('Cascade', () => {
    it('DELETE menu cascades to items', async () => {
      const m = await request(server).post('/menus').send({ name: `Cas_${Date.now()}` }).expect(201);
      const i = await request(server).post('/menu-items').send({ menuId: m.body.id, name: 'CascadeItem', price: 1 }).expect(201);
      await request(server).delete(`/menus/${m.body.id}`).expect(200);
      await request(server).get(`/menu-items/${i.body.id}`).expect(404);
    });

    it('DELETE user cascades to orders', async () => {
      const reg = await request(server).post('/auth/register').send({
        username: `cascade_${Date.now()}`, password: 'Test1234', fullName: 'Cascade User',
      }).expect(201);
      const uid = reg.body.user.id;

      const m = await request(server).post('/menus').send({ name: `CasMenu_${Date.now()}` }).expect(201);
      const i = await request(server).post('/menu-items').send({ menuId: m.body.id, name: 'Item', price: 1 }).expect(201);
      const o = await request(server).post('/orders').send({
        userId: uid, items: [{ menuItemId: i.body.id, quantity: 1 }],
      }).expect(201);

      await dataSource.query('DELETE FROM `users` WHERE `id` = ?', [uid]);
      await request(server).get(`/orders/${o.body.id}`).expect(404);
    });
  });

  // ── DTO Validation ────────────────────────────────────
  describe('DTO Validation', () => {
    it('rejects name >100 chars', async () => {
      await request(server).post('/menus').send({ name: 'a'.repeat(101) }).expect(400);
    });

    it('rejects invalid table status enum', async () => {
      await request(server).post('/tables').send({ tableNumber: 'T1', status: 'BROKEN' }).expect(400);
    });

    it('strips extra fields via whitelist', async () => {
      const res = await request(server).post('/menus').send({ name: `W_${Date.now()}`, injected: 'bad' }).expect(201);
      expect(res.body.injected).toBeUndefined();
    });

    it('GET /menus/not-a-uuid returns 404', async () => {
      await request(server).get('/menus/not-a-uuid').expect(404);
    });
  });

  // ── Edge Cases ────────────────────────────────────────
  describe('Edge cases', () => {
    it('GET /categories — 404 (renamed to /menus)', async () => {
      await request(server).get('/categories').expect(404);
    });

    it('POST /menus — rejects non-JSON body', async () => {
      await request(server).post('/menus').set('Content-Type', 'text/plain').send('not json').expect(400);
    });
  });
});