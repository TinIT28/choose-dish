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

interface ApiEnvironment {
  MODE: string;
  VITE_PUBLIC_API_BASE_URL?: string;
  VITE_API_BASE_URL?: string;
}

const PRODUCTION_API_BASE_URL = 'https://choose-dish-api.vercel.app/api/v1';

export function resolveApiBaseUrl(env: ApiEnvironment) {
  const configuredApiBaseUrl = env.VITE_PUBLIC_API_BASE_URL ?? env.VITE_API_BASE_URL;
  return configuredApiBaseUrl ?? (env.MODE === 'production' ? PRODUCTION_API_BASE_URL : 'http://localhost:3001/api/v1');
}

const API_BASE_URL = resolveApiBaseUrl(import.meta.env);
let refreshHandler: (() => Promise<string | null>) | null = null;
let refreshPromise: Promise<string | null> | null = null;

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
      refreshPromise ??= refreshHandler().finally(() => {
        refreshPromise = null;
      });
      const refreshedAccessToken = await refreshPromise;
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
