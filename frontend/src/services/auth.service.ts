import { post, get, apiRequest } from './api';
import type {
  AuthResponse,
  LoginDto,
  ProfileResponse,
  RegisterDto,
  User,
} from '../types';

/**
 * Register a new user account.
 */
export async function register(dto: RegisterDto): Promise<AuthResponse> {
  const res = await post<AuthResponse>('/auth/register', dto);
  // Store tokens
  localStorage.setItem('access_token', res.accessToken);
  localStorage.setItem('refresh_token', res.refreshToken);
  return res;
}

/**
 * Login with username + password.
 */
export async function login(dto: LoginDto): Promise<AuthResponse> {
  const res = await post<AuthResponse>('/auth/login', dto);
  // Store tokens
  localStorage.setItem('access_token', res.accessToken);
  localStorage.setItem('refresh_token', res.refreshToken);
  return res;
}

/**
 * Fetch the authenticated user's profile.
 * Requires a valid JWT token in localStorage.
 */
export async function getProfile(): Promise<ProfileResponse> {
  return get<ProfileResponse>('/auth/profile');
}

/**
 * Get the current logged-in user info (from cached token claim or profile).
 */
export function getLoggedInUser(): { id: string; username: string; role?: string } | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    // Decode JWT payload (base64)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
/**
 * Change the current user's password.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  return post<{ message: string }>('/auth/change-password', {
    currentPassword,
    newPassword,
  });
}

/**
 * Logout — clear stored tokens.
 */
export function logout(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

/**
 * Check if user is authenticated (has a token stored).
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('access_token');
  if (!token) return false;

  // Check expiration
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}
