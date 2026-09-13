export interface AuthUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | string;
  timezone: string;
  historyRetentionDays: number;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api/v1';

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.');
  }

  return (await response.json()) as T;
}

export function registerRequest(email: string, password: string) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function loginRequest(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function refreshRequest() {
  return request<AuthResponse>('/auth/refresh', { method: 'POST' });
}

export function logoutRequest() {
  return request<{ ok: true }>('/auth/logout', { method: 'POST' });
}

export function logoutAllRequest(accessToken: string) {
  return request<{ ok: true }>('/auth/logout-all', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
