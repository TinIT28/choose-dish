import { describe, expect, it } from 'vitest';
import { SelectionCalendar } from '../selections/selection-calendar';
import { createPrismaFake, type PrismaFakeSeed } from '../testing/prisma-fake';
import { HistoryService } from './history.service';

const now = new Date('2026-09-13T05:00:00.000Z');

function makeService(seed: PrismaFakeSeed = {}) {
  const prisma = createPrismaFake({ users: [{ id: 'user-1', historyRetentionDays: 30 }], ...seed });
  return { prisma, service: new HistoryService(prisma, new SelectionCalendar(prisma)) };
}

describe('HistoryService', () => {
  it('groups selections by local date, newest day and newest selection first', async () => {
    const { service } = makeService({
      selections: [
        { userId: 'user-1', localDate: '2026-09-13', mealPeriod: 'LUNCH', dishNameSnapshot: 'Cơm tấm', selectedAt: new Date('2026-09-13T05:00:00Z') },
        { userId: 'user-1', localDate: '2026-09-12', mealPeriod: 'DINNER', dishNameSnapshot: 'Bún bò', selectedAt: new Date('2026-09-12T12:00:00Z') },
        { userId: 'user-1', localDate: '2026-09-13', mealPeriod: 'BREAKFAST', dishNameSnapshot: 'Bánh mì', selectedAt: new Date('2026-09-13T01:00:00Z') },
      ],
    });

    const result = await service.list('user-1', now);

    expect(result).toEqual([
      {
        localDate: '2026-09-13',
        selections: [expect.objectContaining({ dishNameSnapshot: 'Cơm tấm' }), expect.objectContaining({ dishNameSnapshot: 'Bánh mì' })],
      },
      { localDate: '2026-09-12', selections: [expect.objectContaining({ dishNameSnapshot: 'Bún bò' })] },
    ]);
  });

  it('shows only the selections of the requesting user', async () => {
    const { service } = makeService({
      selections: [
        { userId: 'user-1', localDate: '2026-09-13', dishNameSnapshot: 'Cơm tấm' },
        { userId: 'user-2', localDate: '2026-09-13', dishNameSnapshot: 'Bún bò' },
      ],
    });

    const result = await service.list('user-1', now);

    expect(result).toEqual([{ localDate: '2026-09-13', selections: [expect.objectContaining({ dishNameSnapshot: 'Cơm tấm' })] }]);
  });

  it('drops selections older than the retention window of the user', async () => {
    const { service } = makeService({
      users: [{ id: 'user-1', historyRetentionDays: 7 }],
      selections: [
        { userId: 'user-1', localDate: '2026-09-12', selectedAt: new Date('2026-09-12T05:00:00Z') },
        { userId: 'user-1', localDate: '2026-08-01', selectedAt: new Date('2026-08-01T05:00:00Z') },
      ],
    });

    const result = await service.list('user-1', now);

    expect(result.map((group) => group.localDate)).toEqual(['2026-09-12']);
  });

  it('cuts history on the local day of the user rather than on an instant', async () => {
    const seed: PrismaFakeSeed = {
      users: [{ id: 'user-1', timezone: 'Asia/Ho_Chi_Minh', historyRetentionDays: 7 }],
      selections: [
        { userId: 'user-1', localDate: '2026-09-08', selectedAt: new Date('2026-09-08T02:00:00Z') },
        { userId: 'user-1', localDate: '2026-09-06', selectedAt: new Date('2026-09-06T10:00:00Z') },
      ],
    };
    // Both instants are 2026-09-14 for a user at UTC+7: 07:00 and 23:00 local.
    const earlyInTheDay = makeService(seed);
    const lateInTheDay = makeService(seed);

    const early = await earlyInTheDay.service.list('user-1', new Date('2026-09-14T00:00:00Z'));
    const late = await lateInTheDay.service.list('user-1', new Date('2026-09-14T16:00:00Z'));

    expect(early.map((group) => group.localDate)).toEqual(['2026-09-08']);
    expect(late.map((group) => group.localDate)).toEqual(['2026-09-08']);
  });

  it('sends only the snapshot fields, with the selection time as an ISO string', async () => {
    const { service } = makeService({
      selections: [{ userId: 'user-1', localDate: '2026-09-13', dishId: 'dish-1', selectedAt: new Date('2026-09-13T05:00:00Z') }],
    });

    const [group] = await service.list('user-1', now);

    expect(Object.keys(group.selections[0]).sort()).toEqual(['dishNameSnapshot', 'id', 'localDate', 'mealPeriod', 'selectedAt']);
    expect(group.selections[0].selectedAt).toBe('2026-09-13T05:00:00.000Z');
  });

  it('reports a missing account', async () => {
    const { service } = makeService();

    await expect(service.list('ghost', now)).rejects.toMatchObject({ status: 404 });
  });
});
