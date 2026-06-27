import nock from 'nock';
import { setupApp } from './test-helpers';
import request from 'supertest';
import type { E2ESetup } from './test-helpers';

const { expect } = require('@jest/globals');

describe('Orders', () => {
  let ctx: E2ESetup;
  let orderMenuItemId: string;
  let orderTableId: string;

  beforeAll(async () => {
    ctx = await setupApp();
    const menuRes = await request(ctx.server).post('/menus').send({ name: `OM_${Date.now()}` }).expect(201);
    const itemRes = await request(ctx.server).post('/menu-items').send({ menuId: menuRes.body.id, name: 'Cappuccino', price: 4.5 }).expect(201);
    orderMenuItemId = itemRes.body.id;
    const tableRes = await request(ctx.server).post('/tables').send({ tableNumber: `OT_${Date.now()}` }).expect(201);
    orderTableId = tableRes.body.id;
  });
  afterAll(async () => { nock.cleanAll(); await ctx.app.close(); });

  it('POST /orders — creates order with items and table', async () => {
    const res = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, tableId: orderTableId,
      items: [{ menuItemId: orderMenuItemId, quantity: 2, note: 'no sugar' }],
    }).expect(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].quantity).toBe(2);
    expect(Number(res.body.totalAmount)).toBe(9);
  });

  it('POST /orders — table status becomes OCCUPIED', async () => {
    const t = await request(ctx.server).post('/tables').send({ tableNumber: `OT2_${Date.now()}` }).expect(201);
    await request(ctx.server).post('/orders').send({
      userId: ctx.userId, tableId: t.body.id,
      items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
    }).expect(201);
    const check = await request(ctx.server).get(`/tables/${t.body.id}`).expect(200);
    expect(check.body.status).toBe('OCCUPIED');
  });

  it('POST /orders — takeaway (no table)', async () => {
    const res = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
    }).expect(201);
    expect(res.body.table).toBeNull();
  });

  it('POST /orders — rejects missing userId', async () => {
    await request(ctx.server).post('/orders').send({ items: [{ menuItemId: orderMenuItemId, quantity: 1 }] }).expect(400);
  });

  it('POST /orders — rejects empty items', async () => {
    await request(ctx.server).post('/orders').send({ userId: ctx.userId, items: [] }).expect(400);
  });

  it('POST /orders — 404 on unknown user', async () => {
    await request(ctx.server).post('/orders').send({
      userId: '00000000-0000-0000-0000-000000000000',
      items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
    }).expect(404);
  });

  it('POST /orders — 404 on unknown menuItem', async () => {
    await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
    }).expect(404);
  });

  it('GET /orders — returns array', async () => {
    const res = await request(ctx.server).get('/orders').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /orders/:id — returns order with items', async () => {
    const o = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
    }).expect(201);
    const res = await request(ctx.server).get(`/orders/${o.body.id}`).expect(200);
    expect(res.body.items[0].menuItem).toBeDefined();
  });

  it('PATCH /orders/:id — updates status', async () => {
    const o = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
    }).expect(201);
    const res = await request(ctx.server).patch(`/orders/${o.body.id}`).send({ status: 'CONFIRMED' }).expect(200);
    expect(res.body.status).toBe('CONFIRMED');
  });

  it('PATCH /orders/:id — rejects invalid status', async () => {
    const o = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
    }).expect(201);
    await request(ctx.server).patch(`/orders/${o.body.id}`).send({ status: 'SHIPPED' }).expect(400);
  });

  it('POST /orders/:id/items — adds item', async () => {
    const o = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
    }).expect(201);
    const res = await request(ctx.server).post(`/orders/${o.body.id}/items`)
      .send({ menuItemId: orderMenuItemId, quantity: 1, note: 'hot' }).expect(201);
    expect(res.body.items.length).toBe(2);
    expect(Number(res.body.totalAmount)).toBe(9);
  });

  it('POST /orders/:id/items — 404 on unknown menuItem', async () => {
    const o = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
    }).expect(201);
    await request(ctx.server).post(`/orders/${o.body.id}/items`)
      .send({ menuItemId: '00000000-0000-0000-0000-000000000000', quantity: 1 }).expect(404);
  });

  it('PATCH /orders/:id/items/:itemId — updates quantity', async () => {
    const o = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
    }).expect(201);
    const itemId = o.body.items[0].id;
    const res = await request(ctx.server)
      .patch(`/orders/${o.body.id}/items/${itemId}`)
      .send({ quantity: 3 })
      .expect(200);
    expect(res.body.items[0].quantity).toBe(3);
    expect(Number(res.body.totalAmount)).toBe(13.5);
  });

  it('DELETE /orders/:id/items/:itemId — removes item', async () => {
    const o = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: orderMenuItemId, quantity: 2 }],
    }).expect(201);
    const itemId = o.body.items[0].id;
    const res = await request(ctx.server).delete(`/orders/${o.body.id}/items/${itemId}`).expect(200);
    expect(res.body.items.length).toBe(0);
    expect(Number(res.body.totalAmount)).toBe(0);
  });

  it('DELETE /orders/:id — deletes order', async () => {
    const o = await request(ctx.server).post('/orders').send({
      userId: ctx.userId, items: [{ menuItemId: orderMenuItemId, quantity: 1 }],
    }).expect(201);
    await request(ctx.server).delete(`/orders/${o.body.id}`).expect(200);
    await request(ctx.server).get(`/orders/${o.body.id}`).expect(404);
  });
});
