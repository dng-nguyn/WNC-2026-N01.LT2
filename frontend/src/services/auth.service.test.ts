import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mockFetch, makeJwt } from '../test/helpers';

const mockPost = vi.fn();
const mockGet = vi.fn();

vi.mock('./api', () => ({
  post: (...args: unknown[]) => mockPost(...args),
  get: (...args: unknown[]) => mockGet(...args),
  apiRequest: vi.fn(),
}));

import {
  register,
  login,
  getProfile,
  getLoggedInUser,
  logout,
  isAuthenticated,
} from './auth.service';

describe('auth.service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockPost.mockReset();
    mockGet.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('register', () => {
    it('sends POST to /auth/register with dto and stores tokens in localStorage', async () => {
      const dto = { username: 'testuser', password: 'password123', fullName: 'Test User' };
      const authResponse = {
        message: 'Registered',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: '1', username: 'testuser', createdAt: '2024-01-01T00:00:00.000Z' },
      };
      mockPost.mockResolvedValue(authResponse);

      const result = await register(dto);

      expect(mockPost).toHaveBeenCalledWith('/auth/register', dto);
      expect(localStorage.getItem('access_token')).toBe('access-token');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
      expect(result).toEqual(authResponse);
    });
  });

  describe('login', () => {
    it('sends POST to /auth/login with dto and stores tokens in localStorage', async () => {
      const dto = { username: 'testuser', password: 'password123' };
      const authResponse = {
        message: 'Logged in',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: '1', username: 'testuser', createdAt: '2024-01-01T00:00:00.000Z' },
      };
      mockPost.mockResolvedValue(authResponse);

      const result = await login(dto);

      expect(mockPost).toHaveBeenCalledWith('/auth/login', dto);
      expect(localStorage.getItem('access_token')).toBe('access-token');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
      expect(result).toEqual(authResponse);
    });
  });

  describe('getProfile', () => {
    it('sends GET to /auth/profile', async () => {
      const profile = {
        id: '1',
        username: 'testuser',
        fullName: 'Test User',
        role: 'ADMIN',
      };
      mockGet.mockResolvedValue(profile);

      const result = await getProfile();

      expect(mockGet).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(profile);
    });
  });

  describe('getLoggedInUser', () => {
    it('returns {id, username} from valid JWT in localStorage', () => {
      const token = makeJwt({ sub: '123', username: 'testuser', exp: Math.floor(Date.now() / 1000) + 3600 });
      localStorage.setItem('access_token', token);

      const result = getLoggedInUser();

      expect(result).toEqual({ id: '123', username: 'testuser' });
    });

    it('returns null when no token', () => {
      const result = getLoggedInUser();
      expect(result).toBeNull();
    });

    it('returns null when token is malformed', () => {
      localStorage.setItem('access_token', 'invalid.token.here');
      const result = getLoggedInUser();
      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true for non-expired token', () => {
      const token = makeJwt({ sub: '1', username: 'test', exp: Math.floor(Date.now() / 1000) + 3600 });
      localStorage.setItem('access_token', token);

      expect(isAuthenticated()).toBe(true);
    });

    it('returns false for expired token', () => {
      const token = makeJwt({ sub: '1', username: 'test', exp: Math.floor(Date.now() / 1000) - 3600 });
      localStorage.setItem('access_token', token);

      expect(isAuthenticated()).toBe(false);
    });

    it('returns false when no token', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('returns false for malformed token', () => {
      localStorage.setItem('access_token', 'not.a.valid.jwt');
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears access_token and refresh_token from localStorage', () => {
      localStorage.setItem('access_token', 'access-token');
      localStorage.setItem('refresh_token', 'refresh-token');

      logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });
});