import { describe, expect, it } from 'vitest';
import { SelectionCalendar } from '../selections/selection-calendar';
import { createPrismaFake, type PrismaFakeSeed } from '../testing/prisma-fake';
import { RetentionService } from './retention.service';

const now = new Date('2026-09-13T05:00:00.000Z');

function makeService(seed: PrismaFakeSeed = {}) {
  const prisma = createPrismaFake(seed);
  return { prisma, service: new RetentionService(prisma, new SelectionCalendar(prisma)) };
}

describe('RetentionService', () => {
  it('deletes only the selections older than the retention window of their own user', async () => {
    const { prisma, service } = makeService({
      users: [
        { id: 'short-window', historyRetentionDays: 7 },
        { id: 'long-window', historyRetentionDays: 365 },
      ],
      selections: [
        { id: 'short-recent', userId: 'short-window', localDate: '2026-09-12', selectedAt: new Date('2026-09-12T05:00:00Z') },
        { id: 'short-stale', userId: 'short-window', localDate: '2026-08-01', selectedAt: new Date('2026-08-01T05:00:00Z') },
        { id: 'long-old', userId: 'long-window', localDate: '2026-08-01', selectedAt: new Date('2026-08-01T05:00:00Z') },
      ],
    });

    const result = await service.cleanup(now);

    expect(prisma.store.selection.map((selection) => selection.id)).toEqual(['short-recent', 'long-old']);
    expect(result).toEqual({ deleted: 1, users: 2 });
  });

  it('removes the same selections wherever in the local day the cron happens to run', async () => {
    const seed: PrismaFakeSeed = {
      users: [{ id: 'user-1', timezone: 'Asia/Ho_Chi_Minh', historyRetentionDays: 7 }],
      selections: [
        { id: 'inside-window', userId: 'user-1', localDate: '2026-09-08', selectedAt: new Date('2026-09-08T02:00:00Z') },
        { id: 'outside-window', userId: 'user-1', localDate: '2026-09-06', selectedAt: new Date('2026-09-06T10:00:00Z') },
      ],
    };
    // Both instants fall on 2026-09-14 for a user at UTC+7: 07:00 and 23:00 local.
    const earlyInTheDay = makeService(seed);
    const lateInTheDay = makeService(seed);

    await earlyInTheDay.service.cleanup(new Date('2026-09-14T00:00:00Z'));
    await lateInTheDay.service.cleanup(new Date('2026-09-14T16:00:00Z'));

    expect(earlyInTheDay.prisma.store.selection.map((selection) => selection.id)).toEqual(['inside-window']);
    expect(lateInTheDay.prisma.store.selection.map((selection) => selection.id)).toEqual(['inside-window']);
  });

  it('gives two accounts on the same instant the cutoff of their own timezone', async () => {
    const { prisma, service } = makeService({
      users: [
        { id: 'vietnam', timezone: 'Asia/Ho_Chi_Minh', historyRetentionDays: 7 },
        { id: 'california', timezone: 'America/Los_Angeles', historyRetentionDays: 7 },
      ],
      selections: [
        { id: 'vietnam-boundary', userId: 'vietnam', localDate: '2026-09-06' },
        { id: 'california-boundary', userId: 'california', localDate: '2026-09-06' },
      ],
    });

    // 2026-09-14 in Ho Chi Minh, still 2026-09-13 in Los Angeles, so the cutoffs
    // are 2026-09-07 and 2026-09-06 and only one of these rows is stale.
    await service.cleanup(new Date('2026-09-13T20:00:00.000Z'));

    expect(prisma.store.selection.map((selection) => selection.id)).toEqual(['california-boundary']);
  });

  it('reports zero work when no account has stale selections', async () => {
    const { service } = makeService({ users: [{ id: 'user-1', historyRetentionDays: 30 }] });

    expect(await service.cleanup(now)).toEqual({ deleted: 0, users: 1 });
  });
});
