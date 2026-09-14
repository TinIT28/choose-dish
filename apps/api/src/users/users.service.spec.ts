import { describe, expect, it } from 'vitest';
import { createPrismaFake, type PrismaFakeSeed } from '../testing/prisma-fake';
import { UsersService } from './users.service';

function makeService(seed: PrismaFakeSeed = {}) {
  const prisma = createPrismaFake(seed);
  return { prisma, service: new UsersService(prisma) };
}

describe('UsersService', () => {
  it('rejects a timezone that is not an IANA zone', async () => {
    const { service } = makeService({ users: [{ id: 'user-1' }] });

    await expect(service.updateSettings('user-1', { timezone: 'Not/A_Timezone', historyRetentionDays: 30 })).rejects.toMatchObject({ status: 400 });
  });

  it('rejects a retention window that is not one of the presets', async () => {
    const { service } = makeService({ users: [{ id: 'user-1' }] });

    await expect(service.updateSettings('user-1', { timezone: 'Asia/Ho_Chi_Minh', historyRetentionDays: 14 })).rejects.toMatchObject({ status: 400 });
  });

  it('stores accepted settings on the account', async () => {
    const { service } = makeService({ users: [{ id: 'user-1' }] });

    await service.updateSettings('user-1', { timezone: 'Europe/Paris', historyRetentionDays: 90 });

    expect(await service.findById('user-1')).toMatchObject({ timezone: 'Europe/Paris', historyRetentionDays: 90 });
  });

  it('never answers with the password hash', async () => {
    const { service } = makeService({ users: [{ id: 'user-1', passwordHash: 'argon2-hash' }] });

    const saved = await service.updateSettings('user-1', { timezone: 'Europe/Paris', historyRetentionDays: 90 });

    expect(Object.keys(saved).sort()).toEqual(['email', 'historyRetentionDays', 'id', 'role', 'timezone']);
    expect(await service.findById('user-1')).not.toHaveProperty('passwordHash');
  });

  it('lists only the live sessions of the user, most recently used first', async () => {
    const { service } = makeService({
      sessions: [
        { id: 'older', userId: 'user-1', lastUsedAt: new Date('2026-09-10T00:00:00Z') },
        { id: 'newer', userId: 'user-1', lastUsedAt: new Date('2026-09-13T00:00:00Z') },
        { id: 'revoked', userId: 'user-1', revokedAt: new Date() },
        { id: 'someone-elses', userId: 'user-2' },
      ],
    });

    const sessions = await service.listSessions('user-1');

    expect(sessions.map((session) => session.id)).toEqual(['newer', 'older']);
  });

  it('never leaks the refresh token hash when listing sessions', async () => {
    const { service } = makeService({ sessions: [{ id: 'session-1', userId: 'user-1', refreshTokenHash: 'secret' }] });

    expect(await service.listSessions('user-1')).toEqual([expect.not.objectContaining({ refreshTokenHash: expect.anything() })]);
  });

  it('revokes only a session that belongs to the user', async () => {
    const { service } = makeService({
      sessions: [
        { id: 'mine', userId: 'user-1' },
        { id: 'someone-elses', userId: 'user-2' },
      ],
    });

    const mine = await service.revokeSession('user-1', 'mine');
    const theirs = await service.revokeSession('user-1', 'someone-elses');

    expect(mine.count).toBe(1);
    expect(theirs.count).toBe(0);
    expect(await service.listSessions('user-1')).toEqual([]);
  });

  it('refuses to delete the last admin', async () => {
    const { service } = makeService({ users: [{ id: 'admin-1', role: 'ADMIN' }] });

    await expect(service.deleteAccount('admin-1')).rejects.toMatchObject({ status: 409 });
  });

  it('deletes an admin account while another admin remains', async () => {
    const { service } = makeService({ users: [{ id: 'admin-1', role: 'ADMIN' }, { id: 'admin-2', role: 'ADMIN' }] });

    await service.deleteAccount('admin-1');

    expect(await service.findById('admin-1')).toBeNull();
  });

  it('removes the private dishes, exclusions, selections and sessions of a deleted account', async () => {
    const { prisma, service } = makeService({
      users: [{ id: 'user-1' }],
      dishes: [
        { id: 'mine', scope: 'PRIVATE', ownerId: 'user-1' },
        { id: 'shared', scope: 'SHARED', ownerId: null },
      ],
      personalExclusions: [{ userId: 'user-1', dishId: 'shared' }],
      selections: [{ id: 'selection-1', userId: 'user-1' }],
      sessions: [{ id: 'session-1', userId: 'user-1' }],
    });

    await service.deleteAccount('user-1');

    expect(prisma.store.selection).toEqual([]);
    expect(prisma.store.personalExclusion).toEqual([]);
    expect(prisma.store.session).toEqual([]);
    expect(prisma.store.dish.map((dish) => dish.id)).toEqual(['shared']);
    expect(prisma.store.user).toEqual([]);
  });

  it('reports a missing account rather than deleting nothing quietly', async () => {
    const { service } = makeService();

    await expect(service.deleteAccount('ghost')).rejects.toMatchObject({ status: 404 });
  });
});
