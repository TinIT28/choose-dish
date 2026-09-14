import type { ApiErrorBody } from '@choose-dish/contract';

export interface ApiEnvironment {
  MODE: string;
  VITE_PUBLIC_API_BASE_URL?: string;
  VITE_API_BASE_URL?: string;
}

const PRODUCTION_API_BASE_URL = 'https://choose-dish-api.vercel.app/api/v1';

export function resolveApiBaseUrl(env: ApiEnvironment) {
  const configuredApiBaseUrl = env.VITE_PUBLIC_API_BASE_URL ?? env.VITE_API_BASE_URL;
  return configuredApiBaseUrl ?? (env.MODE === 'production' ? PRODUCTION_API_BASE_URL : 'http://localhost:3001/api/v1');
}

/** Every failed request throws this, so callers can read a status or a code instead of matching on prose. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Signing in is the only thing that can start a session, so a 401 from these
 * paths is an answer, not an expired access token.
 */
const authEntryPoints = new Set(['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']);

const API_BASE_URL = resolveApiBaseUrl(import.meta.env);

let accessToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let refreshInFlight: Promise<string | null> | null = null;

/** The access token lives here, not in the signature of every request function. */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setRefreshHandler(handler: (() => Promise<string | null>) | null) {
  refreshHandler = handler;
}

/**
 * The single place a refresh is started. Concurrent callers — a 401 retry, the
 * session restore on boot, a second component mounting — share one request.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshHandler) return Promise.resolve(null);
  refreshInFlight ??= refreshHandler().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function toApiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as Partial<ApiErrorBody> | null;
  return new ApiError(
    response.status,
    payload?.code ?? `HTTP_${response.status}`,
    payload?.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.',
    payload?.fieldErrors,
  );
}

async function request<T>(method: string, path: string, body?: unknown, canRetry = true): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (response.ok) {
    return (await response.json()) as T;
  }

  if (response.status === 401 && canRetry && !authEntryPoints.has(path)) {
    const refreshedAccessToken = await refreshAccessToken();
    if (refreshedAccessToken) {
      return request<T>(method, path, body, false);
    }
  }

  throw await toApiError(response);
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
