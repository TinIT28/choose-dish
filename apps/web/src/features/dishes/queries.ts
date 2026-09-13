import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  copySharedDish,
  createDish,
  createSharedDish,
  deleteDish,
  deleteSharedDish,
  excludeSharedDish,
  includeSharedDish,
  listAdminUsers,
  listDishes,
  listSharedDishes,
  resetAdminPassword,
  updateDish,
  updateSharedDish,
  type Dish,
} from './api';
import { queryKeys } from '../queryKeys';

type DishInput = Omit<Dish, 'id' | 'isActive'>;

function requireToken(accessToken: string | null) {
  if (!accessToken) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này.');
  return accessToken;
}

export function usePrivateDishesQuery(accessToken: string | null, userId: string | null) {
  return useQuery({
    queryKey: queryKeys.dishes.private(userId ?? 'anonymous'),
    queryFn: () => listDishes(requireToken(accessToken)),
    enabled: Boolean(accessToken && userId),
  });
}

export function useSharedDishesQuery(accessToken: string | null, userId: string | null) {
  return useQuery({
    queryKey: queryKeys.dishes.shared(userId ?? 'anonymous'),
    queryFn: () => listSharedDishes(requireToken(accessToken)),
    enabled: Boolean(accessToken && userId),
  });
}

export function useAdminUsersQuery(accessToken: string | null, adminId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminUsers(adminId ?? 'anonymous'),
    queryFn: () => listAdminUsers(requireToken(accessToken)),
    enabled: Boolean(accessToken && adminId && enabled),
  });
}

export function useCreateDishMutation(accessToken: string | null, userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DishInput) => createDish(requireToken(accessToken), input),
    onSuccess: () => userId ? queryClient.invalidateQueries({ queryKey: queryKeys.dishes.private(userId) }) : undefined,
  });
}

export function useUpdateDishMutation(accessToken: string | null, userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dishId, input }: { dishId: string; input: DishInput }) => updateDish(requireToken(accessToken), dishId, input),
    onSuccess: () => userId ? queryClient.invalidateQueries({ queryKey: queryKeys.dishes.private(userId) }) : undefined,
  });
}

export function useDeleteDishMutation(accessToken: string | null, userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dishId: string) => deleteDish(requireToken(accessToken), dishId),
    onSuccess: () => userId ? queryClient.invalidateQueries({ queryKey: queryKeys.dishes.private(userId) }) : undefined,
  });
}

export function useCopySharedDishMutation(accessToken: string | null, userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dishId: string) => copySharedDish(requireToken(accessToken), dishId),
    onSuccess: () => userId ? queryClient.invalidateQueries({ queryKey: queryKeys.dishes.private(userId) }) : undefined,
  });
}

export function useToggleSharedDishMutation(accessToken: string | null, userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<{ id: string } | { count: number }, Error, { dishId: string; isExcluded?: boolean }>({
    mutationFn: ({ dishId, isExcluded }: { dishId: string; isExcluded?: boolean }) => {
      const token = requireToken(accessToken);
      return isExcluded ? includeSharedDish(token, dishId) : excludeSharedDish(token, dishId);
    },
    onSuccess: () => userId ? queryClient.invalidateQueries({ queryKey: queryKeys.dishes.shared(userId) }) : undefined,
  });
}

export function useCreateSharedDishMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DishInput) => createSharedDish(requireToken(accessToken), input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dishes', 'shared'] }),
  });
}

export function useUpdateSharedDishMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dishId, input }: { dishId: string; input: Partial<DishInput> }) => updateSharedDish(requireToken(accessToken), dishId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dishes', 'shared'] }),
  });
}

export function useDeleteSharedDishMutation(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dishId: string) => deleteSharedDish(requireToken(accessToken), dishId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dishes', 'shared'] }),
  });
}

export function useResetAdminPasswordMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) => resetAdminPassword(requireToken(accessToken), userId, password),
  });
}
