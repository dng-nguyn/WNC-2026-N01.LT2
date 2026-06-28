import nock from 'nock';
import { setupApp } from './test-helpers';
import request from 'supertest';
import type { E2ESetup } from './test-helpers';

const { expect } = require('@jest/globals');

describe('Menus', () => {
  let ctx: E2ESetup;
  beforeAll(async () => { ctx = await setupApp(); });
  afterAll(async () => { nock.cleanAll(); await ctx.app.close(); });

  it('POST /menus — creates a menu', async () => {
    const res = await request(ctx.server).post('/menus').send({ name: `M_${Date.now()}` }).expect(201);
    expect(res.body.name).toBeTruthy();
    expect(res.body.id).toBeTruthy();
  });

  it('POST /menus — rejects name >100 chars', async () => {
    await request(ctx.server).post('/menus').send({ name: 'a'.repeat(101) }).expect(400);
  });

  it('POST /menus — strips extra fields', async () => {
    const res = await request(ctx.server).post('/menus').send({ name: `Strip_${Date.now()}`, extra: 'nope' }).expect(201);
    expect(res.body.extra).toBeUndefined();
  });

  it('GET /menus — returns array', async () => {
    const res = await request(ctx.server).get('/menus').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /menus/:id — returns menu', async () => {
    const c = await request(ctx.server).post('/menus').send({ name: `Get_${Date.now()}` }).expect(201);
    const res = await request(ctx.server).get(`/menus/${c.body.id}`).expect(200);
    expect(res.body.id).toBe(c.body.id);
  });

  it('GET /menus/:id — 404 on unknown', async () => {
    await request(ctx.server).get('/menus/00000000-0000-0000-0000-000000000000').expect(404);
  });

  it('PATCH /menus/:id — updates menu', async () => {
    const c = await request(ctx.server).post('/menus').send({ name: `Patch_${Date.now()}` }).expect(201);
    const res = await request(ctx.server).patch(`/menus/${c.body.id}`).send({ description: 'New desc' }).expect(200);
    expect(res.body.description).toBe('New desc');
  });
});

describe('Menu Items', () => {
  let ctx: E2ESetup;
  let freshMenuId: string;
  beforeAll(async () => {
    ctx = await setupApp();
    const r = await request(ctx.server).post('/menus').send({ name: `MI_${Date.now()}` }).expect(201);
    freshMenuId = r.body.id;
  });
  afterAll(async () => { nock.cleanAll(); await ctx.app.close(); });

  it('POST /menu-items — creates item', async () => {
    const res = await request(ctx.server).post('/menu-items').send({ menuId: freshMenuId, name: 'Espresso', price: 3.5 }).expect(201);
    expect(res.body.name).toBe('Espresso');
    expect(Number(res.body.price)).toBe(3.5);
  });

  it('POST /menu-items — rejects missing menuId', async () => {
    await request(ctx.server).post('/menu-items').send({ name: 'Latte', price: 4 }).expect(400);
  });

  it('POST /menu-items — rejects negative price', async () => {
    await request(ctx.server).post('/menu-items').send({ menuId: freshMenuId, name: 'Bad', price: -1 }).expect(400);
  });

  it('POST /menu-items — 404 on unknown menu', async () => {
    await request(ctx.server).post('/menu-items').send({ menuId: '00000000-0000-0000-0000-000000000000', name: 'Nope', price: 5 }).expect(404);
  });

  it('GET /menu-items/:id — returns item', async () => {
    const c = await request(ctx.server).post('/menu-items').send({ menuId: freshMenuId, name: `G_${Date.now()}`, price: 5 }).expect(201);
    const res = await request(ctx.server).get(`/menu-items/${c.body.id}`).expect(200);
    expect(res.body.id).toBe(c.body.id);
  });

  it('PATCH /menu-items/:id — updates price', async () => {
    const c = await request(ctx.server).post('/menu-items').send({ menuId: freshMenuId, name: `P_${Date.now()}`, price: 3 }).expect(201);
    const res = await request(ctx.server).patch(`/menu-items/${c.body.id}`).send({ price: 4 }).expect(200);
    expect(Number(res.body.price)).toBe(4);
  });

  it('DELETE /menu-items/:id — deletes item', async () => {
    const c = await request(ctx.server).post('/menu-items').send({ menuId: freshMenuId, name: `D_${Date.now()}`, price: 1 }).expect(201);
    await request(ctx.server).delete(`/menu-items/${c.body.id}`).expect(200);
    await request(ctx.server).get(`/menu-items/${c.body.id}`).expect(404);
  });
});
