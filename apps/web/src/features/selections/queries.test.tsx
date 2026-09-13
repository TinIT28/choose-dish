import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { randomSelection } from './api';
import { queryKeys } from '../queryKeys';
import { useRandomSelectionMutation } from './queries';

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api');
  return { ...actual, randomSelection: vi.fn() };
});

function createWrapper(queryClient: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('selection mutations', () => {
  it('invalidates today selections and history after a random selection', async () => {
    vi.mocked(randomSelection).mockResolvedValue({
      id: 'selection-1',
      localDate: '2026-09-13',
      mealPeriod: 'LUNCH',
      dishId: 'dish-1',
      dishNameSnapshot: 'Cơm tấm',
      selectedAt: '2026-09-13T05:00:00.000Z',
    });
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useRandomSelectionMutation('access-token', 'user-1'),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      await result.current.mutateAsync('LUNCH');
    });

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.selections.today('user-1') });
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.history('user-1') });
    });
  });
});
