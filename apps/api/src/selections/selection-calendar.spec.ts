import { describe, expect, it } from 'vitest';
import { createPrismaFake, type PrismaFakeSeed } from '../testing/prisma-fake';
import { SelectionCalendar } from './selection-calendar';

const now = new Date('2026-09-13T20:00:00.000Z');

function makeCalendar(seed: PrismaFakeSeed = {}) {
  const prisma = createPrismaFake(seed);
  return { prisma, calendar: new SelectionCalendar(prisma) };
}

describe('SelectionCalendar', () => {
  it('resolves the day the user is actually in', async () => {
    const { calendar } = makeCalendar({
      users: [
        { id: 'vietnam', timezone: 'Asia/Ho_Chi_Minh' },
        { id: 'california', timezone: 'America/Los_Angeles' },
      ],
    });

    expect((await calendar.forUser('vietnam', now)).today).toBe('2026-09-14');
    expect((await calendar.forUser('california', now)).today).toBe('2026-09-13');
  });

  it('spans the no-repeat window back from that day', async () => {
    const { calendar } = makeCalendar({ users: [{ id: 'user-1', timezone: 'Asia/Ho_Chi_Minh' }] });

    const { noRepeatWindow } = await calendar.forUser('user-1', now);

    expect(noRepeatWindow).toHaveLength(7);
    expect(noRepeatWindow[0]).toBe('2026-09-14');
    expect(noRepeatWindow.at(-1)).toBe('2026-09-08');
  });

  it('keeps a selection that is exactly as old as the configured period', async () => {
    const { calendar } = makeCalendar({
      users: [
        { id: 'short', timezone: 'Asia/Ho_Chi_Minh', historyRetentionDays: 7 },
        { id: 'long', timezone: 'Asia/Ho_Chi_Minh', historyRetentionDays: 30 },
      ],
    });

    // Today is 2026-09-14 for these accounts, and only what is *older* than the
    // period is removed, so the cutoff day itself is still retained.
    expect((await calendar.forUser('short', now)).retentionCutoff).toBe('2026-09-07');
    expect((await calendar.forUser('long', now)).retentionCutoff).toBe('2026-08-15');
  });

  it('derives the retention cutoff from the local day of the user, not from UTC', async () => {
    const { calendar } = makeCalendar({
      users: [
        { id: 'vietnam', timezone: 'Asia/Ho_Chi_Minh', historyRetentionDays: 7 },
        { id: 'california', timezone: 'America/Los_Angeles', historyRetentionDays: 7 },
      ],
    });

    expect((await calendar.forUser('vietnam', now)).retentionCutoff).toBe('2026-09-07');
    expect((await calendar.forUser('california', now)).retentionCutoff).toBe('2026-09-06');
  });

  it('reports a missing account', async () => {
    const { calendar } = makeCalendar();

    await expect(calendar.forUser('ghost', now)).rejects.toMatchObject({ status: 404 });
  });

  it('reads every account in one pass for scheduled work', async () => {
    const { calendar } = makeCalendar({
      users: [
        { id: 'vietnam', timezone: 'Asia/Ho_Chi_Minh', historyRetentionDays: 7 },
        { id: 'california', timezone: 'America/Los_Angeles', historyRetentionDays: 30 },
      ],
    });

    const calendars = await calendar.forEveryUser(now);

    expect(calendars).toEqual([
      expect.objectContaining({ userId: 'vietnam', today: '2026-09-14', retentionCutoff: '2026-09-07' }),
      expect.objectContaining({ userId: 'california', today: '2026-09-13', retentionCutoff: '2026-08-14' }),
    ]);
  });
});
