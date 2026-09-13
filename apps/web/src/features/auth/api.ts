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
let refreshHandler: (() => Promise<string | null>) | null = null;

export function registerRefreshHandler(handler: (() => Promise<string | null>) | null) {
  refreshHandler = handler;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, accessToken?: string, canRetry = true): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401 && canRetry && refreshHandler && accessToken && path !== '/auth/refresh') {
      const refreshedAccessToken = await refreshHandler();
      if (refreshedAccessToken) {
        return apiRequest<T>(path, init, refreshedAccessToken, false);
      }
    }
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    const error = new Error(payload?.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.');
    Object.assign(error, { status: response.status });
    throw error;
  }

  return (await response.json()) as T;
}

export function registerRequest(email: string, password: string) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function loginRequest(email: string, password: string) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function refreshRequest() {
  return apiRequest<AuthResponse>('/auth/refresh', { method: 'POST' });
}

export function logoutRequest() {
  return apiRequest<{ ok: true }>('/auth/logout', { method: 'POST' });
}

export function logoutAllRequest(accessToken: string) {
  return apiRequest<{ ok: true }>('/auth/logout-all', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
