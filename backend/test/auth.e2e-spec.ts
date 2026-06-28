import nock from 'nock';
import { setupApp } from './test-helpers';
import request from 'supertest';
import type { E2ESetup } from './test-helpers';

describe('Auth', () => {
  let ctx: E2ESetup;
  beforeAll(async () => { ctx = await setupApp(); });
  afterAll(async () => { nock.cleanAll(); await ctx.app.close(); });

  const { expect } = require('@jest/globals');

  it('POST /auth/register — creates user and returns tokens', async () => {
    const username = `reg_${Date.now()}`;
    const res = await request(ctx.server)
      .post('/auth/register')
      .send({ username, password: 'Test1234', fullName: 'E2E Tester' })
      .expect(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('POST /auth/register — rejects duplicate username', async () => {
    const username = `dup_${Date.now()}`;
    await request(ctx.server).post('/auth/register').send({ username, password: 'Test1234', fullName: 'First' }).expect(201);
    await request(ctx.server).post('/auth/register').send({ username, password: 'Test1234', fullName: 'Second' }).expect(409);
  });

  it('POST /auth/register — rejects short username (<3)', async () => {
    await request(ctx.server).post('/auth/register').send({ username: 'ab', password: 'Test1234' }).expect(400);
  });

  it('POST /auth/register — rejects short password (<8)', async () => {
    await request(ctx.server).post('/auth/register').send({ username: `p_${Date.now()}`, password: 'Short1', fullName: 'X' }).expect(400);
  });

  it('POST /auth/register — rejects password without uppercase', async () => {
    await request(ctx.server).post('/auth/register').send({ username: `l_${Date.now()}`, password: 'lowercase1', fullName: 'X' }).expect(400);
  });

  it('POST /auth/register — rejects password without number', async () => {
    await request(ctx.server).post('/auth/register').send({ username: `n_${Date.now()}`, password: 'NoNumberHere', fullName: 'X' }).expect(400);
  });

  it('POST /auth/register — strips extra fields via whitelist', async () => {
    const res = await request(ctx.server)
      .post('/auth/register')
      .send({ username: `strip_${Date.now()}`, password: 'Test1234', fullName: 'OK', hackerField: 'bad' })
      .expect(201);
    expect(res.body.user.hackerField).toBeUndefined();
  });

  it('POST /auth/login — authenticates and returns tokens', async () => {
    const username = `login_${Date.now()}`;
    await request(ctx.server).post('/auth/register').send({ username, password: 'Test1234', fullName: 'X' });
    const res = await request(ctx.server).post('/auth/login').send({ username, password: 'Test1234' }).expect(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('POST /auth/login — rejects wrong password', async () => {
    const username = `badpw_${Date.now()}`;
    await request(ctx.server).post('/auth/register').send({ username, password: 'Test1234', fullName: 'X' });
    await request(ctx.server).post('/auth/login').send({ username, password: 'WrongPass1' }).expect(401);
  });

  it('POST /auth/login — rejects password without uppercase', async () => {
    const username = `weak_${Date.now()}`;
    await request(ctx.server).post('/auth/register').send({ username, password: 'Test1234', fullName: 'X' });
    await request(ctx.server).post('/auth/login').send({ username, password: 'weak' }).expect(400);
  });

  it('GET /auth/profile — returns authenticated user with token', async () => {
    const res = await request(ctx.server).get('/auth/profile').set('Authorization', `Bearer ${ctx.token}`).expect(200);
    expect(res.body.user.username).toBeTruthy();
  });

  it('GET /auth/profile — returns 401 without token', async () => {
    await request(ctx.server).get('/auth/profile').expect(401);
  });

  it('GET /auth/profile — returns 401 with invalid token', async () => {
    await request(ctx.server).get('/auth/profile').set('Authorization', 'Bearer garbage').expect(401);
  });

  it('POST /auth/refresh — exchanges refresh token for new pair', async () => {
    const username = `ref_${Date.now()}`;
    const regRes = await request(ctx.server).post('/auth/register').send({ username, password: 'Test1234', fullName: 'X' }).expect(201);
    const res = await request(ctx.server)
      .post('/auth/refresh')
      .send({ refreshToken: regRes.body.refreshToken })
      .expect(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('POST /auth/logout — confirms logout', async () => {
    const res = await request(ctx.server).post('/auth/logout').expect(201);
    expect(res.body.message).toBe('Logout successful');
  });
});
