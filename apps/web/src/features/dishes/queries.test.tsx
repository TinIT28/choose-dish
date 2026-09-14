import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createDish, type Dish } from './api';
import { queryKeys } from '../queryKeys';
import { useCreateDishMutation } from './queries';

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api');
  return { ...actual, createDish: vi.fn() };
});

const dish: Dish = {
  id: 'dish-1',
  name: 'Cơm tấm',
  shortDescription: 'Sườn nướng',
  imageUrl: 'https://example.com/com-tam.jpg',
  cloudinaryPublicId: 'com-tam',
  isActive: true,
};

function createWrapper(queryClient: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('dish mutations', () => {
  it('invalidates the current user private dishes after creating a dish', async () => {
    vi.mocked(createDish).mockResolvedValue(dish);
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useCreateDishMutation('user-1'),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      await result.current.mutateAsync({
        name: dish.name,
        shortDescription: dish.shortDescription,
        imageUrl: dish.imageUrl,
        cloudinaryPublicId: dish.cloudinaryPublicId,
      });
    });

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.dishes.private('user-1') }));
  });
});
