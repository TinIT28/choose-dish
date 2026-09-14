import * as argon2 from 'argon2';
import { describe, expect, it, vi } from 'vitest';
import { createPrismaFake, type PrismaFakeSeed } from '../testing/prisma-fake';
import { makeAppConfig } from '../testing/test-config';
import { AuthService } from './auth.service';

/**
 * The JWT seam stays a stub: these specs are about session records and rotation,
 * not about signature formats. Tokens are round-tripped through a payload map so
 * `verifyAsync` returns whatever `signAsync` was given.
 */
function makeJwt() {
  const payloads = new Map<string, Record<string, unknown>>();
  let issued = 0;
  return {
    signAsync: vi.fn(async (payload: Record<string, unknown>) => {
      issued += 1;
      const token = `token-${issued}`;
      payloads.set(token, payload);
      return token;
    }),
    verifyAsync: vi.fn(async (token: string) => {
      const payload = payloads.get(token);
      if (!payload) throw new Error('invalid token');
      return payload;
    }),
  };
}

function makeService(seed: PrismaFakeSeed = {}) {
  const prisma = createPrismaFake(seed);
  return { prisma, service: new AuthService(prisma, makeJwt() as never, makeAppConfig()) };
}

async function seedUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: await argon2.hash('strong-password', { type: argon2.argon2id }),
    role: 'USER',
    ...overrides,
  };
}

describe('AuthService', () => {
  it('makes the first registered account an admin and every later one a normal user', async () => {
    const { service } = makeService();

    const first = await service.register('  First@Example.com  ', 'strong-password');
    const second = await service.register('second@example.com', 'strong-password');

    expect(first.user).toMatchObject({ email: 'first@example.com', role: 'ADMIN' });
    expect(second.user).toMatchObject({ email: 'second@example.com', role: 'USER' });
  });

  it('opens a session that records how the account signed in', async () => {
    const { prisma, service } = makeService();

    await service.register('user@example.com', 'strong-password', { userAgent: 'Firefox', ipAddress: '203.0.113.4' });

    expect(prisma.store.session).toHaveLength(1);
    expect(prisma.store.session[0]).toMatchObject({ userAgent: 'Firefox', ipAddress: '203.0.113.4', revokedAt: null });
  });

  it('never stores the refresh token itself', async () => {
    const { prisma, service } = makeService();

    const tokens = await service.register('user@example.com', 'strong-password');

    expect(prisma.store.session[0].refreshTokenHash).not.toBe(tokens.refreshToken);
  });

  it('accepts a correct password regardless of how the email was typed', async () => {
    const { service } = makeService({ users: [await seedUser()] });

    const tokens = await service.login('  USER@Example.com ', 'strong-password');

    expect(tokens.user).toMatchObject({ id: 'user-1' });
  });

  it('rejects an unknown account and a wrong password the same way', async () => {
    const { service } = makeService({ users: [await seedUser()] });

    await expect(service.login('missing@example.com', 'strong-password')).rejects.toMatchObject({ status: 401 });
    await expect(service.login('user@example.com', 'wrong-password')).rejects.toMatchObject({ status: 401 });
  });

  it('rotates the refresh token so the previous one stops working', async () => {
    const { service } = makeService({ users: [await seedUser()] });
    const first = await service.login('user@example.com', 'strong-password');

    const second = await service.refresh(first.refreshToken);

    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect(second.user).toMatchObject({ id: 'user-1' });
  });

  it('revokes the whole session when a refresh token is replayed', async () => {
    const { prisma, service } = makeService({ users: [await seedUser()] });
    const first = await service.login('user@example.com', 'strong-password');
    await service.refresh(first.refreshToken);

    await expect(service.refresh(first.refreshToken)).rejects.toMatchObject({ status: 401 });
    expect(prisma.store.session[0].revokedAt).toBeInstanceOf(Date);
  });

  it('refuses a refresh token whose session was revoked or has expired', async () => {
    const { prisma, service } = makeService({ users: [await seedUser()] });
    const revoked = await service.login('user@example.com', 'strong-password');
    prisma.store.session[0].revokedAt = new Date();

    await expect(service.refresh(revoked.refreshToken)).rejects.toMatchObject({ status: 401 });
  });

  it('revokes the session behind a logout and stays quiet about a token it cannot read', async () => {
    const { prisma, service } = makeService({ users: [await seedUser()] });
    const tokens = await service.login('user@example.com', 'strong-password');

    await service.revokeRefreshToken(tokens.refreshToken);
    await expect(service.revokeRefreshToken('not-a-token')).resolves.toBeUndefined();

    expect(prisma.store.session[0].revokedAt).toBeInstanceOf(Date);
  });

  it('revokes every live session when the account signs out everywhere', async () => {
    const { prisma, service } = makeService({ users: [await seedUser()] });
    await service.login('user@example.com', 'strong-password');
    await service.login('user@example.com', 'strong-password');

    await service.logoutAll('user-1');

    expect(prisma.store.session.every((session) => session.revokedAt instanceof Date)).toBe(true);
  });

  it('resolves the account behind a valid access token and rejects an unreadable one', async () => {
    const { service } = makeService({ users: [await seedUser()] });
    const tokens = await service.login('user@example.com', 'strong-password');

    await expect(service.verifyAccessToken(tokens.accessToken)).resolves.toMatchObject({ id: 'user-1', role: 'USER' });
    await expect(service.verifyAccessToken('not-a-token')).rejects.toMatchObject({ status: 401 });
  });

  it('rejects an access token whose account no longer exists', async () => {
    const { prisma, service } = makeService({ users: [await seedUser()] });
    const tokens = await service.login('user@example.com', 'strong-password');
    prisma.store.user = [];

    await expect(service.verifyAccessToken(tokens.accessToken)).rejects.toMatchObject({ status: 401 });
  });
});
