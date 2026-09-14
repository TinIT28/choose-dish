import { describe, expect, it } from 'vitest';
import { recentLocalDates } from './local-date';
import { selectCandidateDish } from './selection-rules';

const window = recentLocalDates('2026-09-13', 7);

describe('selection rules', () => {
  it('skips the dishes chosen inside the no-repeat window', () => {
    const dishes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const recentSelections = [
      { localDate: '2026-09-13', dishId: 'a' },
      { localDate: '2026-09-12', dishId: 'b' },
    ];

    expect(selectCandidateDish(dishes, recentSelections, window, () => 0)).toBe('c');
  });

  it('ignores selections older than the window', () => {
    const dishes = [{ id: 'a' }];
    const recentSelections = [{ localDate: '2026-08-01', dishId: 'a' }];

    expect(selectCandidateDish(dishes, recentSelections, window, () => 0)).toBe('a');
  });

  it('relaxes the oldest date first when every dish is recent', () => {
    const dishes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const recentSelections = [
      { localDate: '2026-09-13', dishId: 'a' },
      { localDate: '2026-09-12', dishId: 'b' },
      { localDate: '2026-09-07', dishId: 'c' },
    ];

    expect(selectCandidateDish(dishes, recentSelections, window, () => 0)).toBe('c');
  });

  it('throws a typed error when the accessible catalog is empty', () => {
    expect(() => selectCandidateDish([], [], window, () => 0)).toThrowError('NO_AVAILABLE_DISH');
  });
});
