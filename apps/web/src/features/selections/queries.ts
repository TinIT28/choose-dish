import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { listTodaySelections, randomSelection, type MealPeriod } from './api';

function requireToken(accessToken: string | null) {
  if (!accessToken) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này.');
  return accessToken;
}

export function useTodaySelectionsQuery(accessToken: string | null, userId: string | null) {
  return useQuery({
    queryKey: queryKeys.selections.today(userId ?? 'anonymous'),
    queryFn: () => listTodaySelections(requireToken(accessToken)),
    enabled: Boolean(accessToken && userId),
  });
}

export function useRandomSelectionMutation(accessToken: string | null, userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mealPeriod: MealPeriod) => randomSelection(requireToken(accessToken), mealPeriod),
    onSuccess: async () => {
      if (!userId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.selections.today(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.history(userId) }),
      ]);
    },
  });
}
