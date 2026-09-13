import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { listHistory } from './api';

export function useHistoryQuery(accessToken: string | null, userId: string | null) {
  return useQuery({
    queryKey: queryKeys.history(userId ?? 'anonymous'),
    queryFn: () => {
      if (!accessToken) throw new Error('Bạn cần đăng nhập để xem lịch sử.');
      return listHistory(accessToken);
    },
    enabled: Boolean(accessToken && userId),
  });
}
