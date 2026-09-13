import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

function makeJwt() {
  return {
    signAsync: vi.fn().mockResolvedValueOnce('access-token').mockResolvedValue('refresh-token'),
    verifyAsync: vi.fn(),
  };
}

describe('AuthService', () => {
  it('makes the first registered user an admin and returns a token pair', async () => {
    const createdUser = {
      id: 'user-1',
      email: 'first@example.com',
      passwordHash: 'hash',
      role: 'ADMIN',
      timezone: 'Asia/Ho_Chi_Minh',
      historyRetentionDays: 30,
    };
    const transaction = {
      user: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue(createdUser),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (tx: typeof transaction) => unknown) => callback(transaction)),
      session: { create: vi.fn().mockResolvedValue({}) },
    };
    const service = new AuthService(prisma as never, makeJwt() as never);

    const result = await service.register(' First@Example.com ', 'strong-password');

    expect(transaction.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'first@example.com', role: 'ADMIN' }),
      }),
    );
    expect(result.accessToken).toBe('access-token');
    expect(result.user).toEqual(expect.objectContaining({ email: 'first@example.com', role: 'ADMIN' }));
  });

  it('rejects invalid login credentials', async () => {
    const prisma = { user: { findUnique: vi.fn().mockResolvedValue(null) } };
    const service = new AuthService(prisma as never, makeJwt() as never);

    await expect(service.login('missing@example.com', 'wrong-password')).rejects.toMatchObject({
      status: 401,
    });
  });

  it('rotates the refresh token on a valid session', async () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      timezone: 'Asia/Ho_Chi_Minh',
      historyRetentionDays: 30,
    };
    const session = {
      id: 'session-1',
      userId: user.id,
      refreshTokenHash: createHash('sha256').update('old-refresh-token').digest('hex'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      user,
    };
    const jwt = makeJwt();
    jwt.verifyAsync.mockResolvedValue({ sub: user.id, sid: session.id });
    const prisma = {
      session: {
        findUnique: vi.fn().mockResolvedValue(session),
        update: vi.fn().mockResolvedValue(session),
      },
    };
    const service = new AuthService(prisma as never, jwt as never);

    const result = await service.refresh('old-refresh-token');

    expect(prisma.session.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: session.id }, data: expect.objectContaining({ refreshTokenHash: expect.any(String) }) }),
    );
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
  });
});
