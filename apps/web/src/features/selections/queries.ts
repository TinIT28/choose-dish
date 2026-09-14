import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { listTodaySelections, randomSelection, type MealPeriod } from './api';

export function useTodaySelectionsQuery(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.selections.today(userId ?? 'anonymous'),
    queryFn: listTodaySelections,
    enabled: Boolean(userId),
  });
}

export function useRandomSelectionMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mealPeriod: MealPeriod) => randomSelection(mealPeriod),
    onSuccess: async () => {
      if (!userId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.selections.today(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.history(userId) }),
      ]);
    },
  });
}
