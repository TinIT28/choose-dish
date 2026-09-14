import type { LocalDate } from './local-date';

export interface CandidateDish {
  id: string;
}

export interface RecentSelection {
  localDate: LocalDate;
  dishId: string;
}

/**
 * Picks a dish the user has not had inside the no-repeat window.
 *
 * When every candidate is in the window the window is relaxed one day at a time,
 * oldest first, so a small catalog still returns something rather than failing.
 */
export function selectCandidateDish(
  dishes: CandidateDish[],
  recentSelections: RecentSelection[],
  noRepeatWindow: LocalDate[],
  random: () => number = Math.random,
) {
  if (dishes.length === 0) {
    throw new Error('NO_AVAILABLE_DISH');
  }

  for (let relaxedDates = 0; relaxedDates <= noRepeatWindow.length; relaxedDates += 1) {
    const datesToExclude = new Set(noRepeatWindow.slice(0, noRepeatWindow.length - relaxedDates));
    const excludedDishIds = new Set(
      recentSelections.filter((selection) => datesToExclude.has(selection.localDate)).map((selection) => selection.dishId),
    );
    const candidates = dishes.filter((dish) => !excludedDishIds.has(dish.id));
    if (candidates.length > 0) {
      const index = Math.min(candidates.length - 1, Math.floor(Math.max(0, random()) * candidates.length));
      return candidates[index].id;
    }
  }

  throw new Error('NO_AVAILABLE_DISH');
}
