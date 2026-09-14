import type { Dish, SharedDish } from '../dishes/api';
import { getAvailableDishes, type DishCandidate } from './availableDishes';
import type { MealPeriod, Selection } from './api';

export const mealPeriods: MealPeriod[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

/** Used until the account reports its own timezone. */
export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** When each meal period runs, in minutes after local midnight. */
const mealWindows: Record<MealPeriod, { start: number; end: number }> = {
  BREAKFAST: { start: 360, end: 630 },
  LUNCH: { start: 630, end: 870 },
  DINNER: { start: 1020, end: 1320 },
};

function getMinutesInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return Math.min(hour, 23) * 60 + minute;
}

export function getCurrentMealPeriod(now: Date, timezone: string): MealPeriod {
  const currentMinutes = getMinutesInTimezone(now, timezone);
  // Once dinner service is over, the next meal to think about is tomorrow's breakfast.
  if (currentMinutes >= mealWindows.DINNER.end || currentMinutes < mealWindows.LUNCH.start) return 'BREAKFAST';
  if (currentMinutes < mealWindows.LUNCH.end) return 'LUNCH';
  return 'DINNER';
}

export interface SelectionDayInput {
  selections?: Selection[];
  privateDishes?: Dish[];
  sharedDishes?: SharedDish[];
  timezone?: string;
  now: Date;
}

export interface SelectionDay {
  timezone: string;
  /** What the user can be offered, private dishes winning on a duplicate id. */
  candidates: DishCandidate[];
  byMealPeriod: Record<MealPeriod, Selection | undefined>;
  focusMealPeriod: MealPeriod;
  focusSelection: Selection | undefined;
  completedMeals: number;
  isDayComplete: boolean;
}

/**
 * Everything the dashboard decides about today, in one place.
 *
 * These decisions used to sit in the component body, which made the one that
 * matters invisible: whether a private dish beats a shared one on a duplicate id
 * was expressed only by the order the two lists were concatenated in.
 */
export function buildSelectionDay({ selections = [], privateDishes = [], sharedDishes = [], timezone = DEFAULT_TIMEZONE, now }: SelectionDayInput): SelectionDay {
  // Private dishes come first, so a copied shared dish resolves to the user's own.
  const candidates = getAvailableDishes([...privateDishes, ...sharedDishes]);
  const byMealPeriod = Object.fromEntries(
    mealPeriods.map((mealPeriod) => [mealPeriod, selections.find((selection) => selection.mealPeriod === mealPeriod)]),
  ) as Record<MealPeriod, Selection | undefined>;
  const completedMeals = mealPeriods.filter((mealPeriod) => byMealPeriod[mealPeriod]).length;
  const isDayComplete = completedMeals === mealPeriods.length;
  // The focus follows the clock, not what is already chosen: on a phone this card
  // holds the only action, and a Selection can always be made again.
  const focusMealPeriod = isDayComplete ? 'DINNER' : getCurrentMealPeriod(now, timezone);

  return {
    timezone,
    candidates,
    byMealPeriod,
    focusMealPeriod,
    focusSelection: byMealPeriod[focusMealPeriod],
    completedMeals,
    isDayComplete,
  };
}
