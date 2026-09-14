import { describe, expect, it } from 'vitest';
import { isValidTimezone, recentLocalDates, shiftLocalDate, toLocalDate } from './local-date';

describe('local dates', () => {
  it('reads the calendar date of the user, not of UTC', () => {
    const lateEvening = new Date('2026-09-13T16:30:00.000Z');

    expect(toLocalDate(lateEvening, 'Asia/Ho_Chi_Minh')).toBe('2026-09-13');
    expect(toLocalDate(lateEvening, 'UTC')).toBe('2026-09-13');
    expect(toLocalDate(new Date('2026-09-13T20:00:00.000Z'), 'Asia/Ho_Chi_Minh')).toBe('2026-09-14');
    expect(toLocalDate(new Date('2026-09-13T02:00:00.000Z'), 'America/Los_Angeles')).toBe('2026-09-12');
  });

  it('shifts across month and year boundaries', () => {
    expect(shiftLocalDate('2026-09-13', -1)).toBe('2026-09-12');
    expect(shiftLocalDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftLocalDate('2024-03-01', -1)).toBe('2024-02-29');
    expect(shiftLocalDate('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftLocalDate('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('lists a window of consecutive dates, newest first', () => {
    expect(recentLocalDates('2026-09-13', 7)).toEqual([
      '2026-09-13',
      '2026-09-12',
      '2026-09-11',
      '2026-09-10',
      '2026-09-09',
      '2026-09-08',
      '2026-09-07',
    ]);
  });

  it('keeps local dates sortable as plain strings', () => {
    expect(['2026-09-13', '2026-08-01', '2026-09-02'].sort()).toEqual(['2026-08-01', '2026-09-02', '2026-09-13']);
    expect('2026-09-07' < '2026-09-13').toBe(true);
  });

  it('recognises IANA zones and rejects anything else', () => {
    expect(isValidTimezone('Asia/Ho_Chi_Minh')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Not/A_Timezone')).toBe(false);
    expect(isValidTimezone('')).toBe(false);
  });
});
