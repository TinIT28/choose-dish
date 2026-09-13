import { describe, expect, it } from 'vitest';
import { getLocalDate, getRecentLocalDates, selectCandidateDish } from './selection-rules';

describe('selection rules', () => {
  it('uses the user timezone when deriving the local date and seven-day window', () => {
    const instant = new Date('2026-09-13T16:30:00.000Z');

    expect(getLocalDate(instant, 'Asia/Ho_Chi_Minh')).toBe('2026-09-13');
    expect(getRecentLocalDates('2026-09-13')).toEqual([
      '2026-09-13',
      '2026-09-12',
      '2026-09-11',
      '2026-09-10',
      '2026-09-09',
      '2026-09-08',
      '2026-09-07',
    ]);
  });

  it('excludes recent dishes and relaxes the oldest date before failing', () => {
    const dishes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const recentSelections = [
      { localDate: '2026-09-13', dishId: 'a' },
      { localDate: '2026-09-12', dishId: 'b' },
      { localDate: '2026-09-07', dishId: 'c' },
    ];

    expect(selectCandidateDish(dishes, recentSelections, '2026-09-13', () => 0)).toBe('c');
  });

  it('throws a typed error when the accessible catalog is empty', () => {
    expect(() => selectCandidateDish([], [], '2026-09-13', () => 0)).toThrowError('NO_AVAILABLE_DISH');
  });
});
