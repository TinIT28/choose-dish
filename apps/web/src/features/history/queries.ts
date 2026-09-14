import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { listHistory } from './api';

export function useHistoryQuery(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.history(userId ?? 'anonymous'),
    queryFn: listHistory,
    enabled: Boolean(userId),
  });
}
