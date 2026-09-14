import { useMemo } from 'react';
import { usePrivateDishesQuery, useSharedDishesQuery } from '../dishes/queries';
import { buildSelectionDay, type SelectionDay } from './selection-day';
import { useTodaySelectionsQuery } from './queries';

export interface SelectionDayState extends SelectionDay {
  isPending: boolean;
  /** One of the two catalogs failed; the day is still usable with what loaded. */
  hasCatalogError: boolean;
}

/** Gathers the three queries the dashboard reads and hands back one day. */
export function useSelectionDay(userId: string | null, timezone: string | undefined, now: Date): SelectionDayState {
  const selectionsQuery = useTodaySelectionsQuery(userId);
  const privateDishesQuery = usePrivateDishesQuery(userId);
  const sharedDishesQuery = useSharedDishesQuery(userId);

  const day = useMemo(
    () =>
      buildSelectionDay({
        selections: selectionsQuery.data,
        privateDishes: privateDishesQuery.data,
        sharedDishes: sharedDishesQuery.data,
        timezone,
        now,
      }),
    [now, privateDishesQuery.data, selectionsQuery.data, sharedDishesQuery.data, timezone],
  );

  return {
    ...day,
    isPending: selectionsQuery.isPending,
    hasCatalogError: privateDishesQuery.isError || sharedDishesQuery.isError,
  };
}
