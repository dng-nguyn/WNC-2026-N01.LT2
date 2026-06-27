import nock from 'nock';
import { setupApp } from './test-helpers';
import request from 'supertest';
import type { E2ESetup } from './test-helpers';

const { expect } = require('@jest/globals');

describe('Tables', () => {
  let ctx: E2ESetup;
  beforeAll(async () => { ctx = await setupApp(); });
  afterAll(async () => { nock.cleanAll(); await ctx.app.close(); });

  it('POST /tables — creates table', async () => {
    const res = await request(ctx.server).post('/tables').send({ tableNumber: `T${Date.now()}` }).expect(201);
    expect(res.body.status).toBe('EMPTY');
  });

  it('POST /tables — creates with status', async () => {
    const res = await request(ctx.server).post('/tables').send({ tableNumber: `TR_${Date.now()}`, status: 'RESERVED' }).expect(201);
    expect(res.body.status).toBe('RESERVED');
  });

  it('POST /tables — rejects invalid status', async () => {
    await request(ctx.server).post('/tables').send({ tableNumber: 'Bad', status: 'BROKEN' }).expect(400);
  });

  it('GET /tables — returns array', async () => {
    const res = await request(ctx.server).get('/tables').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /tables/:id — updates status', async () => {
    const c = await request(ctx.server).post('/tables').send({ tableNumber: `PT_${Date.now()}` }).expect(201);
    const res = await request(ctx.server).patch(`/tables/${c.body.id}`).send({ status: 'OCCUPIED' }).expect(200);
    expect(res.body.status).toBe('OCCUPIED');
  });

  it('DELETE /tables/:id — deletes table', async () => {
    const c = await request(ctx.server).post('/tables').send({ tableNumber: `DT_${Date.now()}` }).expect(201);
    await request(ctx.server).delete(`/tables/${c.body.id}`).expect(200);
    await request(ctx.server).get(`/tables/${c.body.id}`).expect(404);
  });
});
