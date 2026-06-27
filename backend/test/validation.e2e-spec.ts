import nock from 'nock';
import { setupApp } from './test-helpers';
import request from 'supertest';
import type { E2ESetup } from './test-helpers';

const { expect } = require('@jest/globals');

describe('Validation', () => {
  let ctx: E2ESetup;
  beforeAll(async () => { ctx = await setupApp(); });
  afterAll(async () => { nock.cleanAll(); await ctx.app.close(); });

  it('rejects name >100 chars', async () => {
    await request(ctx.server).post('/menus').send({ name: 'a'.repeat(101) }).expect(400);
  });

  it('rejects invalid table status enum', async () => {
    await request(ctx.server).post('/tables').send({ tableNumber: 'T1', status: 'BROKEN' }).expect(400);
  });

  it('strips extra fields via whitelist', async () => {
    const res = await request(ctx.server).post('/menus').send({ name: `W_${Date.now()}`, injected: 'bad' }).expect(201);
    expect(res.body.injected).toBeUndefined();
  });

  it('GET /menus/not-a-uuid returns 404', async () => {
    await request(ctx.server).get('/menus/not-a-uuid').expect(404);
  });

  it('GET /categories — 404 (renamed to /menus)', async () => {
    await request(ctx.server).get('/categories').expect(404);
  });

  it('POST /menus — rejects non-JSON body', async () => {
    await request(ctx.server).post('/menus').set('Content-Type', 'text/plain').send('not json').expect(400);
  });
});
