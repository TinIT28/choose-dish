import type { HistoryGroupView } from '@choose-dish/contract';
import { http } from '../../lib/http';

export type { HistoryGroupView as HistoryGroup, HistorySelectionView as HistorySelection } from '@choose-dish/contract';

export function listHistory() {
  return http.get<HistoryGroupView[]>('/history');
}
