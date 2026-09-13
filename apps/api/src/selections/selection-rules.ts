export interface CandidateDish {
  id: string;
}

export interface RecentSelection {
  localDate: string;
  dishId: string;
}

export function getLocalDate(instant: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getRecentLocalDates(currentLocalDate: string) {
  return getLocalDates(currentLocalDate, 7);
}

export function getLocalDates(currentLocalDate: string, count: number) {
  const [year, month, day] = currentLocalDate.split('-').map(Number);
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(Date.UTC(year, month - 1, day - offset));
    return date.toISOString().slice(0, 10);
  });
}

export function selectCandidateDish(
  dishes: CandidateDish[],
  recentSelections: RecentSelection[],
  currentLocalDate: string,
  random: () => number = Math.random,
) {
  if (dishes.length === 0) {
    throw new Error('NO_AVAILABLE_DISH');
  }

  const recentDates = getRecentLocalDates(currentLocalDate);
  for (let relaxedDates = 0; relaxedDates <= recentDates.length; relaxedDates += 1) {
    const datesToExclude = new Set(recentDates.slice(0, recentDates.length - relaxedDates));
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
