import type { Request, Response } from 'express';
import { describe, expect, it } from 'vitest';
import { makeAppConfig } from '../testing/test-config';
import { REFRESH_COOKIE_NAME, REFRESH_TOKEN_TTL_MS, RefreshSession } from './refresh-session';
import type { TokenPair } from './auth.types';

function makeResponse() {
  const cookies: { name: string; value?: string; options: Record<string, unknown> }[] = [];
  const cleared: { name: string; options: Record<string, unknown> }[] = [];
  const response = {
    cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }),
    clearCookie: (name: string, options: Record<string, unknown>) => cleared.push({ name, options }),
  } as unknown as Response;
  return { response, cookies, cleared };
}

const tokens: TokenPair = {
  user: { id: 'user-1', email: 'user@example.com', role: 'USER', timezone: 'Asia/Ho_Chi_Minh', historyRetentionDays: 30 },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

function makeSession(environment: NodeJS.ProcessEnv = {}) {
  return new RefreshSession(makeAppConfig(environment));
}

describe('RefreshSession', () => {
  it('keeps the refresh token out of the response body', () => {
    const { response } = makeResponse();

    const body = makeSession().open(response, tokens);

    expect(body).toEqual({ user: tokens.user, accessToken: 'access-token' });
    expect(JSON.stringify(body)).not.toContain('refresh-token');
  });

  it('puts the refresh token in an HttpOnly cookie scoped to the auth routes', () => {
    const { response, cookies } = makeResponse();

    makeSession().open(response, tokens);

    expect(cookies).toEqual([
      {
        name: REFRESH_COOKIE_NAME,
        value: 'refresh-token',
        options: expect.objectContaining({ httpOnly: true, path: '/api/v1/auth', maxAge: REFRESH_TOKEN_TTL_MS }),
      },
    ]);
  });

  it('derives the cookie path from the API prefix rather than repeating it', () => {
    const { response, cookies } = makeResponse();

    makeSession().open(response, tokens);

    expect(cookies[0].options.path).toBe(`/${makeAppConfig().apiPrefix}/auth`);
  });

  it('sends the cookie over plain HTTP in development and cross-site only in production', () => {
    const development = makeResponse();
    const vercelPreview = makeResponse();
    const production = makeResponse();

    makeSession({ NODE_ENV: 'development' }).open(development.response, tokens);
    makeSession({ NODE_ENV: undefined, VERCEL: '1', ...productionVariables }).open(vercelPreview.response, tokens);
    makeSession({ NODE_ENV: 'production', ...productionVariables }).open(production.response, tokens);

    expect(development.cookies[0].options).toMatchObject({ secure: false, sameSite: 'lax' });
    expect(vercelPreview.cookies[0].options).toMatchObject({ secure: true, sameSite: 'lax' });
    expect(production.cookies[0].options).toMatchObject({ secure: true, sameSite: 'none' });
  });

  it('clears the cookie with the same attributes it was set with', () => {
    const { response, cookies, cleared } = makeResponse();
    const session = makeSession();

    session.open(response, tokens);
    session.close(response);

    const attributesWithoutLifetime = Object.fromEntries(Object.entries(cookies[0].options).filter(([key]) => key !== 'maxAge'));
    expect(cleared).toEqual([{ name: REFRESH_COOKIE_NAME, options: attributesWithoutLifetime }]);
  });

  it('reads the refresh token back out of the request', () => {
    const session = makeSession();

    expect(session.read({ cookies: { [REFRESH_COOKIE_NAME]: 'refresh-token' } } as unknown as Request)).toBe('refresh-token');
    expect(session.read({ cookies: {} } as unknown as Request)).toBeUndefined();
    expect(session.read({} as unknown as Request)).toBeUndefined();
  });
});

const productionVariables = {
  DATABASE_URL: 'postgresql://localhost/choose-dish',
  DIRECT_URL: 'postgresql://localhost/choose-dish',
  FRONTEND_ORIGIN: 'https://choose-dish.example.com',
  CRON_SECRET: 'cron-secret',
};
