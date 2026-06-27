import nock from 'nock';
import { setupApp } from './test-helpers';
import request from 'supertest';
import type { E2ESetup } from './test-helpers';

const { expect } = require('@jest/globals');

describe('Cascade', () => {
  let ctx: E2ESetup;
  beforeAll(async () => { ctx = await setupApp(); });
  afterAll(async () => { nock.cleanAll(); await ctx.app.close(); });

  it('DELETE menu cascades to items', async () => {
    const m = await request(ctx.server).post('/menus').send({ name: `Cas_${Date.now()}` }).expect(201);
    const i = await request(ctx.server).post('/menu-items').send({ menuId: m.body.id, name: 'CascadeItem', price: 1 }).expect(201);
    await request(ctx.server).delete(`/menus/${m.body.id}`).expect(200);
    await request(ctx.server).get(`/menu-items/${i.body.id}`).expect(404);
  });

  it('DELETE user cascades to orders', async () => {
    const reg = await request(ctx.server).post('/auth/register').send({
      username: `cascade_${Date.now()}`, password: 'Test1234', fullName: 'Cascade User',
    }).expect(201);
    const uid = reg.body.user.id;

    const m = await request(ctx.server).post('/menus').send({ name: `CasMenu_${Date.now()}` }).expect(201);
    const i = await request(ctx.server).post('/menu-items').send({ menuId: m.body.id, name: 'Item', price: 1 }).expect(201);
    const o = await request(ctx.server).post('/orders').send({
      userId: uid, items: [{ menuItemId: i.body.id, quantity: 1 }],
    }).expect(201);

    await ctx.dataSource.query('DELETE FROM `users` WHERE `id` = ?', [uid]);
    await request(ctx.server).get(`/orders/${o.body.id}`).expect(404);
  });
});
