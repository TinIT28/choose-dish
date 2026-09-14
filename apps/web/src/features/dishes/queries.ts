import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  copySharedDish,
  createDish,
  createSharedDish,
  deleteDish,
  deleteSharedDish,
  excludeSharedDish,
  listAdminUsers,
  listDishes,
  listSharedDishes,
  resetAdminPassword,
  unexcludeSharedDish,
  updateDish,
  updateSharedDish,
  type CreateDishInput,
  type UpdateDishInput,
} from './api';
import { queryKeys } from '../queryKeys';

/** Every shared-dish reader invalidates the same key, so the admin hooks need the viewer too. */
function invalidateShared(queryClient: ReturnType<typeof useQueryClient>, userId: string | null) {
  return userId ? queryClient.invalidateQueries({ queryKey: queryKeys.dishes.shared(userId) }) : undefined;
}

function invalidatePrivate(queryClient: ReturnType<typeof useQueryClient>, userId: string | null) {
  return userId ? queryClient.invalidateQueries({ queryKey: queryKeys.dishes.private(userId) }) : undefined;
}

export function usePrivateDishesQuery(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.dishes.private(userId ?? 'anonymous'),
    queryFn: listDishes,
    enabled: Boolean(userId),
  });
}

export function useSharedDishesQuery(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.dishes.shared(userId ?? 'anonymous'),
    queryFn: listSharedDishes,
    enabled: Boolean(userId),
  });
}

export function useAdminUsersQuery(adminId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminUsers(adminId ?? 'anonymous'),
    queryFn: listAdminUsers,
    enabled: Boolean(adminId && enabled),
  });
}

export function useCreateDishMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDishInput) => createDish(input),
    onSuccess: () => invalidatePrivate(queryClient, userId),
  });
}

export function useUpdateDishMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dishId, input }: { dishId: string; input: UpdateDishInput }) => updateDish(dishId, input),
    onSuccess: () => invalidatePrivate(queryClient, userId),
  });
}

export function useDeleteDishMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDish,
    onSuccess: () => invalidatePrivate(queryClient, userId),
  });
}

export function useCopySharedDishMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: copySharedDish,
    onSuccess: () => invalidatePrivate(queryClient, userId),
  });
}

/** Adding and removing a personal exclusion answer with different bodies; neither caller reads them. */
export function useToggleSharedDishMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dishId, isExcluded }: { dishId: string; isExcluded: boolean }) => {
      await (isExcluded ? unexcludeSharedDish(dishId) : excludeSharedDish(dishId));
    },
    onSuccess: () => invalidateShared(queryClient, userId),
  });
}

export function useCreateSharedDishMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDishInput) => createSharedDish(input),
    onSuccess: () => invalidateShared(queryClient, userId),
  });
}

export function useUpdateSharedDishMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dishId, input }: { dishId: string; input: UpdateDishInput }) => updateSharedDish(dishId, input),
    onSuccess: () => invalidateShared(queryClient, userId),
  });
}

export function useDeleteSharedDishMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSharedDish,
    onSuccess: () => invalidateShared(queryClient, userId),
  });
}

export function useResetAdminPasswordMutation() {
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) => resetAdminPassword(userId, password),
  });
}
