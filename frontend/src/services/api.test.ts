import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mockFetch, makeJwt } from '../test/helpers';
import {
  apiRequest,
  get,
  post,
  patch,
  del,
  ApiError,
} from './api';

describe('apiRequest', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends correct method, path, body, and Content-Type header', async () => {
    const responseBody = { success: true };
    mockFetch(200, responseBody);

    await apiRequest('POST', '/test', { foo: 'bar' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ foo: 'bar' }),
      })
    );
  });

  it('injects Authorization: Bearer <token> from localStorage', async () => {
    const token = makeJwt({ sub: '1', username: 'test' });
    localStorage.setItem('access_token', token);
    mockFetch(200, { ok: true });

    await apiRequest('GET', '/protected');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/protected'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
        }),
      })
    );
  });

  it('skips auth header when skipAuth: true', async () => {
    const token = makeJwt({ sub: '1', username: 'test' });
    localStorage.setItem('access_token', token);
    mockFetch(200, { ok: true });

    await apiRequest('GET', '/public', undefined, { skipAuth: true });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/public'),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.any(String),
        }),
      })
    );
  });

  it('returns undefined for 204 No Content', async () => {
    mockFetch(204, null);

    const result = await apiRequest<unknown>('DELETE', '/resource');

    expect(result).toBeUndefined();
  });

  it('throws ApiError with status and message on non-ok response', async () => {
    const errorBody = { message: 'Not found', code: 'NOT_FOUND' };
    mockFetch(404, errorBody);

    await expect(apiRequest('GET', '/missing')).rejects.toThrow(ApiError);

    try {
      await apiRequest('GET', '/missing');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(404);
      expect((err as ApiError).message).toBe('Not found');
      expect((err as ApiError).data).toEqual(errorBody);
    }
  });

  it('ApiError has correct name, status, message, data properties', () => {
    const error = new ApiError(500, 'Server error', { detail: 'internal' });

    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(500);
    expect(error.message).toBe('Server error');
    expect(error.data).toEqual({ detail: 'internal' });
  });

  it('uses VITE_API_BASE_URL env var as base URL (default: http://localhost:3000)', async () => {
    mockFetch(200, { ok: true });

    await apiRequest('GET', '/endpoint');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/endpoint',
      expect.any(Object)
    );
  });
});

describe('convenience helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('get calls apiRequest with GET method', async () => {
    mockFetch(200, { data: 'test' });

    await get('/test');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('post calls apiRequest with POST method and body', async () => {
    mockFetch(201, { created: true });

    await post('/test', { name: 'item' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'item' }),
      })
    );
  });

  it('patch calls apiRequest with PATCH method and body', async () => {
    mockFetch(200, { updated: true });

    await patch('/test', { name: 'updated' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'updated' }),
      })
    );
  });

  it('del calls apiRequest with DELETE method', async () => {
    mockFetch(204, null);

    await del('/test');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});