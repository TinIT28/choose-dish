import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getAccessToken, http, refreshAccessToken, resolveApiBaseUrl, setAccessToken, setRefreshHandler } from './http';

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  setAccessToken(null);
  setRefreshHandler(null);
});

afterEach(() => vi.unstubAllGlobals());

function lastRequest() {
  return fetchMock.mock.calls.at(-1) as [string, RequestInit];
}

describe('resolveApiBaseUrl', () => {
  it('uses the public Vercel config variable for production builds', () => {
    expect(
      resolveApiBaseUrl({ MODE: 'production', VITE_PUBLIC_API_BASE_URL: 'https://choose-dish-api.vercel.app/api/v1' }),
    ).toBe('https://choose-dish-api.vercel.app/api/v1');
  });

  it('uses the deployed API when Vercel does not inject the public config', () => {
    expect(resolveApiBaseUrl({ MODE: 'production' })).toBe('https://choose-dish-api.vercel.app/api/v1');
  });

  it('talks to the local API in development', () => {
    expect(resolveApiBaseUrl({ MODE: 'development' })).toBe('http://localhost:3001/api/v1');
  });
});

describe('http', () => {
  it('sends the stored access token without the caller passing it', async () => {
    setAccessToken('access-token');
    fetchMock.mockResolvedValue(jsonResponse(200, []));

    await http.get('/dishes');

    expect(lastRequest()[1].headers).toMatchObject({ Authorization: 'Bearer access-token' });
  });

  it('omits the authorization header when there is no session', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));

    await http.post('/auth/login', { email: 'user@example.com', password: 'secret' });

    expect(lastRequest()[1].headers).not.toHaveProperty('Authorization');
  });

  it('sends the refresh cookie with every request', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));

    await http.get('/dishes');

    expect(lastRequest()[1].credentials).toBe('include');
  });

  it('raises a typed error carrying the status and code from the API', async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, { code: 'NO_AVAILABLE_DISH', message: 'Chưa có món phù hợp' }));

    const error = await http.post('/selections/random').catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'NO_AVAILABLE_DISH', message: 'Chưa có món phù hợp' });
  });

  it('falls back to a readable message when the body is not the error shape', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error('not json'); } } as unknown as Response);

    await expect(http.get('/dishes')).rejects.toMatchObject({ status: 502, code: 'HTTP_502' });
  });

  it('refreshes once and replays the request after a 401', async () => {
    setAccessToken('stale-token');
    setRefreshHandler(async () => {
      setAccessToken('fresh-token');
      return 'fresh-token';
    });
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: 'hết hạn' })).mockResolvedValueOnce(jsonResponse(200, [{ id: 'dish-1' }]));

    const dishes = await http.get('/dishes');

    expect(dishes).toEqual([{ id: 'dish-1' }]);
    expect(lastRequest()[1].headers).toMatchObject({ Authorization: 'Bearer fresh-token' });
  });

  it('refreshes only once for requests that fail together', async () => {
    setAccessToken('stale-token');
    const refresh = vi.fn(async () => {
      setAccessToken('fresh-token');
      return 'fresh-token';
    });
    setRefreshHandler(refresh);
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) =>
      (init.headers as Record<string, string>).Authorization === 'Bearer fresh-token' ? jsonResponse(200, []) : jsonResponse(401, {}),
    );

    await Promise.all([http.get('/dishes'), http.get('/history'), http.get('/selections/today')]);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('gives up after one replay rather than looping', async () => {
    setAccessToken('stale-token');
    setRefreshHandler(async () => 'fresh-token');
    fetchMock.mockResolvedValue(jsonResponse(401, { message: 'vẫn hết hạn' }));

    await expect(http.get('/dishes')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('treats a 401 from signing in as the answer, not an expired session', async () => {
    const refresh = vi.fn(async () => 'fresh-token');
    setRefreshHandler(refresh);
    fetchMock.mockResolvedValue(jsonResponse(401, { message: 'Email hoặc mật khẩu không đúng' }));

    await expect(http.post('/auth/login', {})).rejects.toMatchObject({ status: 401 });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('retries an authenticated sign-out-everywhere request like any other call', async () => {
    setAccessToken('stale-token');
    const refresh = vi.fn(async () => {
      setAccessToken('fresh-token');
      return 'fresh-token';
    });
    setRefreshHandler(refresh);
    fetchMock.mockResolvedValueOnce(jsonResponse(401, {})).mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await expect(http.post('/auth/logout-all')).resolves.toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('reports no session when nothing can refresh one', async () => {
    setAccessToken('stale-token');
    fetchMock.mockResolvedValue(jsonResponse(401, { message: 'hết hạn' }));

    await expect(http.get('/dishes')).rejects.toMatchObject({ status: 401 });
    expect(await refreshAccessToken()).toBeNull();
  });

  it('clears the stored token on sign-out', () => {
    setAccessToken('access-token');
    setAccessToken(null);

    expect(getAccessToken()).toBeNull();
  });
});
