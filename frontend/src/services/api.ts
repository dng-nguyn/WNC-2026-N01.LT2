const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get the stored JWT access token from localStorage.
 */
function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Core request function — wraps fetch with base URL, JSON headers,
 * JWT injection, and unified error handling.
 */
export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: { skipAuth?: boolean },
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!options?.skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.message || json.error || `Request failed (${res.status})`,
      json,
    );
  }

  return json as T;
}

// Convenience helpers

export function get<T>(path: string): Promise<T> {
  return apiRequest<T>('GET', path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>('POST', path, body);
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>('PATCH', path, body);
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>('PUT', path, body);
}

export function del<T = void>(path: string): Promise<T> {
  return apiRequest<T>('DELETE', path);
}
