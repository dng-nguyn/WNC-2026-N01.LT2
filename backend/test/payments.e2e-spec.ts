import nock from 'nock';
import { setupApp } from './test-helpers';
import request from 'supertest';
import type { E2ESetup } from './test-helpers';

const { expect } = require('@jest/globals');

describe('Payments', () => {
  let ctx: E2ESetup;
  let paymentMenuItemId: string;

  beforeAll(async () => {
    ctx = await setupApp();
    const m = await request(ctx.server).post('/menus').send({ name: `PM_${Date.now()}` }).expect(201);
    const i = await request(ctx.server).post('/menu-items').send({ menuId: m.body.id, name: 'Espresso', price: 2.5 }).expect(201);
    paymentMenuItemId = i.body.id;
  });
  afterAll(async () => { nock.cleanAll(); await ctx.app.close(); });

  it('POST /payments/qr — creates QR payment', async () => {
    const o = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: paymentMenuItemId, quantity: 3 }],
    }).expect(201);
    const res = await request(ctx.server).post('/payments/qr').send({ orderId: o.body.id }).expect(201);
    expect(res.body.code).toHaveLength(12);
    expect(res.body.status).toBe('PENDING');
  });

  it('GET /payments/:id — returns payment details', async () => {
    const o = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: paymentMenuItemId, quantity: 3 }],
    }).expect(201);
    const p = await request(ctx.server).post('/payments/qr').send({ orderId: o.body.id }).expect(201);
    const res = await request(ctx.server).get(`/payments/${p.body.id}`).expect(200);
    expect(res.body.status).toBe('PENDING');
  });

  it('GET /payments/order/:orderId — returns payments', async () => {
    const o = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: paymentMenuItemId, quantity: 1 }],
    }).expect(201);
    const p = await request(ctx.server).post('/payments/qr').send({ orderId: o.body.id }).expect(201);
    const res = await request(ctx.server).get(`/payments/order/${o.body.id}`).expect(200);
    expect(res.body[0].id).toBe(p.body.id);
  });

  it('POST /payments/:id/verify — mocked Sepay updates payment and order', async () => {
    const o = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: paymentMenuItemId, quantity: 2 }],
    }).expect(201);
    const p = await request(ctx.server).post('/payments/qr').send({ orderId: o.body.id }).expect(201);

    nock('https://my.sepay.vn')
      .get('/userapi/transactions/list')
      .query(true)
      .reply(200, {
        status: 200,
        transactions: [{
          id: 'tx-mock-999',
          amount_in: String(p.body.amount),
          transaction_content: 'Chuyen tien ' + p.body.code + ' tu KH',
        }],
      });

    const res = await request(ctx.server).post(`/payments/${p.body.id}/verify`).expect(201);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.sepayTransactionId).toBe('tx-mock-999');

    const orderCheck = await request(ctx.server).get(`/orders/${o.body.id}`).expect(200);
    expect(orderCheck.body.status).toBe('COMPLETED');
  });

  it('POST /payments/qr — 404 on unknown order', async () => {
    await request(ctx.server).post('/payments/qr').send({ orderId: '00000000-0000-0000-0000-000000000000' }).expect(404);
  });

  it('POST /payments/qr — rejects missing orderId', async () => {
    await request(ctx.server).post('/payments/qr').send({}).expect(400);
  });
});
