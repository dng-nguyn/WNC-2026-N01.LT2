import { vi } from 'vitest';

/** Create a mock fetch that returns the given status and body */
export function mockFetch(status: number, body: unknown, ok?: boolean) {
  const response = {
    ok: ok ?? (status >= 200 && status < 300),
    status,
    json: () => Promise.resolve(body),
  };
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(response as Response);
}

/** Create a valid-looking JWT with the given payload */
export function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}
